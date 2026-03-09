import './section-title.css';

type SectionTitleProps = {
  children: string;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return <p className="inspector-section-title">{children}</p>;
}
