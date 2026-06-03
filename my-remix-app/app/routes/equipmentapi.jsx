import { json } from "@remix-run/node";
import { prisma } from "../server/db.server.js"; // Đảm bảo đã khai báo Prisma client

export async function loader({ request }) {
  const url = new URL(request.url);
  const intensity = url.searchParams.get("intensity");

  if (!intensity) {
    return json({ error: "Intensity not provided" }, { status: 400 });
  }

  // Lấy danh sách equipment dựa trên intensity
  const equipmentOptions = await prisma.exercise.findMany({
    distinct: ["equipment"],
    where: { intensity },
    select: { equipment: true, gifUrl: true },
  });

  return json({
    equipmentOptions: equipmentOptions.map(({ equipment, gifUrl }) => ({
      equipment,
      gifUrl,
    })),
  });
}
