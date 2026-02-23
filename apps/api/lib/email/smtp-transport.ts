import net from "net";
import tls from "tls";

export type TenantSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string | null;
  replyTo?: string | null;
};

type SocketLike = net.Socket | tls.TLSSocket;

function formatAddress(email: string, name?: string | null): string {
  if (!name?.trim()) return `<${email}>`;
  const escaped = name.replace(/"/g, '\\"');
  return `"${escaped}" <${email}>`;
}

function createLineReader(socket: SocketLike) {
  let buffer = "";
  const queue: string[] = [];
  const waiters: Array<(line: string) => void> = [];

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let idx = buffer.indexOf("\n");
    while (idx !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (waiters.length > 0) {
        const resolve = waiters.shift();
        resolve?.(line);
      } else {
        queue.push(line);
      }
      idx = buffer.indexOf("\n");
    }
  });

  return async function readLine(): Promise<string> {
    if (queue.length > 0) return queue.shift() as string;
    return new Promise((resolve) => waiters.push(resolve));
  };
}

async function readResponse(readLine: () => Promise<string>) {
  const lines: string[] = [];
  let code = 0;
  while (true) {
    const line = await readLine();
    lines.push(line);
    const match = /^(\d{3})([\s-])(.*)$/.exec(line);
    if (!match) continue;
    code = Number(match[1]);
    const separator = match[2];
    if (separator === " ") break;
  }
  return { code, lines };
}

async function write(socket: SocketLike, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(value, (error) => (error ? reject(error) : resolve()));
  });
}

async function sendCommand(
  socket: SocketLike,
  readLine: () => Promise<string>,
  command: string,
  expectedCodes: number[]
) {
  await write(socket, `${command}\r\n`);
  const response = await readResponse(readLine);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${command}): ${response.lines.join(" | ")}`);
  }
  return response;
}

export async function sendSmtpTestEmail(args: {
  config: TenantSmtpConfig;
  toEmail: string;
  subject?: string;
  text?: string;
  timeoutMs?: number;
}): Promise<void> {
  const { config, toEmail } = args;
  const subject = args.subject ?? "InspectOS SMTP test";
  const text = args.text ?? "SMTP configuration test email from InspectOS.";
  const timeoutMs = args.timeoutMs ?? 15000;

  const openSocket = (): Promise<SocketLike> => {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      if (config.secure) {
        const secureSocket = tls.connect(
          {
            host: config.host,
            port: config.port,
            servername: config.host,
            rejectUnauthorized: true,
          },
          () => resolve(secureSocket)
        );
        secureSocket.once("error", onError);
      } else {
        const plainSocket = net.connect({ host: config.host, port: config.port }, () => resolve(plainSocket));
        plainSocket.once("error", onError);
      }
    });
  };

  const socket = await openSocket();
  socket.setTimeout(timeoutMs, () => socket.destroy(new Error("SMTP connection timed out")));
  const readLine = createLineReader(socket);

  try {
    const greeting = await readResponse(readLine);
    if (greeting.code !== 220) {
      throw new Error(`SMTP greeting failed: ${greeting.lines.join(" | ")}`);
    }

    const ehlo = await sendCommand(socket, readLine, "EHLO inspectos.co", [250]);
    const supportsStartTls = ehlo.lines.some((line) => /STARTTLS/i.test(line));

    let activeSocket = socket;
    let activeReadLine = readLine;

    if (!config.secure && supportsStartTls) {
      await sendCommand(activeSocket, activeReadLine, "STARTTLS", [220]);
      const upgradedSocket = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const tlsSocket = tls.connect(
          {
            socket: activeSocket,
            servername: config.host,
            rejectUnauthorized: true,
          },
          () => resolve(tlsSocket)
        );
        tlsSocket.once("error", reject);
      });
      activeSocket = upgradedSocket;
      activeReadLine = createLineReader(activeSocket);
      await sendCommand(activeSocket, activeReadLine, "EHLO inspectos.co", [250]);
    }

    if (config.username && config.password) {
      await sendCommand(activeSocket, activeReadLine, "AUTH LOGIN", [334]);
      await sendCommand(
        activeSocket,
        activeReadLine,
        Buffer.from(config.username, "utf8").toString("base64"),
        [334]
      );
      await sendCommand(
        activeSocket,
        activeReadLine,
        Buffer.from(config.password, "utf8").toString("base64"),
        [235]
      );
    }

    await sendCommand(activeSocket, activeReadLine, `MAIL FROM:<${config.fromEmail}>`, [250]);
    await sendCommand(activeSocket, activeReadLine, `RCPT TO:<${toEmail}>`, [250, 251]);
    await sendCommand(activeSocket, activeReadLine, "DATA", [354]);

    const headers = [
      `From: ${formatAddress(config.fromEmail, config.fromName)}`,
      `To: <${toEmail}>`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      ...(config.replyTo ? [`Reply-To: <${config.replyTo}>`] : []),
      "",
      text,
    ];
    const payload = `${headers.join("\r\n").replace(/\n\./g, "\n..")}\r\n.\r\n`;
    await write(activeSocket, payload);
    const dataResponse = await readResponse(activeReadLine);
    if (dataResponse.code !== 250) {
      throw new Error(`SMTP DATA failed: ${dataResponse.lines.join(" | ")}`);
    }

    await sendCommand(activeSocket, activeReadLine, "QUIT", [221]);
  } finally {
    socket.destroy();
  }
}

