import type { NextApiRequest, NextApiResponse } from "next";

/** Pages-Router-Test: POST funktioniert? */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    res.status(200).json({ ok: true, method: "POST", router: "pages" });
  } else {
    res.status(200).json({ ok: true, method: req.method ?? "GET", router: "pages" });
  }
}
