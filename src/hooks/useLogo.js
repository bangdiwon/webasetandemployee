import { useState, useEffect } from "react";

export const LOGO_PATH = `${process.env.PUBLIC_URL}/logo.png`;

/**
 * Memuat public/logo.png sebagai data-URL agar tetap tampil saat
 * Print, Download PDF, dan Download Word (tidak bergantung URL server).
 */
export default function useLogo() {
  const [logo, setLogo] = useState(LOGO_PATH);

  useEffect(() => {
    let cancelled = false;
    fetch(LOGO_PATH)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }),
      )
      .then((dataUrl) => !cancelled && setLogo(dataUrl))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return logo;
}
