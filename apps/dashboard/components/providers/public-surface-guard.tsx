"use client";

import { useEffect } from "react";
import { resetBrandColor } from "@/context/brand-color";

export function PublicSurfaceGuard() {
  useEffect(() => {
    document.body.classList.remove("admin-dense");
    resetBrandColor();
  }, []);

  return null;
}

