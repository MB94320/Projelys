import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function toMonthKey(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const projectNumberFilter = searchParams.get("projectNumber") || undefined;
    const pmFilter = searchParams.get("pm") || undefined;
    const statusFilter = searchParams.get("status") || undefined;

    const deliverables = await prisma.deliverable.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            titleProject: true,
            clientName: true,
            projectManagerName: true,
            status: true,
          },
        },
      },
      orderBy: { contractualDate: "asc" },
    });

    const filtered = deliverables.filter((d) => {
      const p = d.project;
      if (!p) return false;

      if (projectNumberFilter && p.projectNumber !== projectNumberFilter) {
        return false;
      }
      if (pmFilter && p.projectManagerName !== pmFilter) {
        return false;
      }
      if (statusFilter && p.status !== statusFilter) {
        return false;
      }

      return true;
    });

    const total = filtered.length;
    const delivered = filtered.filter((d) => d.deliveredDate).length;

    const deliveredItems = filtered.filter(
      (d) => d.deliveredDate && (d.contractualDate || d.revisedDate),
    );

    const evaluatedItems = deliveredItems.filter(
      (d) => d.status === "Validé" || d.status === "Refusé",
    );
    const validated = evaluatedItems.filter(
      (d) => d.status === "Validé",
    ).length;
    const oqd = evaluatedItems.length
      ? (validated / evaluatedItems.length) * 100
      : 0;

    const onTime = deliveredItems.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
      return (
        new Date(d.deliveredDate!).getTime() <=
        new Date(refDate).getTime()
      );
    }).length;

    const lateItems = deliveredItems.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
      return (
        new Date(d.deliveredDate!).getTime() >
        new Date(refDate).getTime()
      );
    });

    const dod =
      lateItems.length === 0
        ? 0
        : lateItems.reduce((sum, d) => {
            const refDate =
              d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
            const diff =
              new Date(d.deliveredDate!).getTime() -
              new Date(refDate).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0) / lateItems.length;

    const kpi = {
      deliverables: {
        total,
        delivered,
        onTime,
        otd: deliveredItems.length
          ? (onTime / deliveredItems.length) * 100
          : 0,
        oqd,
        dod,
      },
    };

    type Bucket = {
      delivered: number;
      deliveredItems: typeof deliveredItems;
      onTime: number;
      evaluated: number;
      validated: number;
      lateItems: typeof lateItems;
    };

    const monthly: Record<string, Bucket> = {};

    for (const d of filtered) {
      const deliveredDate = d.deliveredDate
        ? new Date(d.deliveredDate)
        : null;
      const key = toMonthKey(deliveredDate);
      if (!key) continue;

      if (!monthly[key]) {
        monthly[key] = {
          delivered: 0,
          deliveredItems: [],
          onTime: 0,
          evaluated: 0,
          validated: 0,
          lateItems: [],
        };
      }

      const b = monthly[key];
      if (d.deliveredDate) {
        b.delivered += 1;
      }

      const hasDeadline = d.contractualDate || d.revisedDate;
      if (d.deliveredDate && hasDeadline) {
        b.deliveredItems.push(d);

        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
        const deliveredTime = new Date(d.deliveredDate!).getTime();
        const refTime = new Date(refDate).getTime();

        if (deliveredTime <= refTime) {
          b.onTime += 1;
        } else {
          b.lateItems.push(d);
        }

        const isEvaluated =
          d.status === "Validé" || d.status === "Refusé";
        if (isEvaluated) {
          b.evaluated += 1;
          if (d.status === "Validé") {
            b.validated += 1;
          }
        }
      }
    }

    const monthlyCount = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => ({
        label,
        value: b.delivered,
      }));

    const monthlyOtd = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        const value = b.deliveredItems.length
          ? (b.onTime / b.deliveredItems.length) * 100
          : 0;
        return {
          label,
          value,
          extra: b.deliveredItems.length,
        };
      });

    const monthlyOqd = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        const value = b.evaluated
          ? (b.validated / b.evaluated) * 100
          : 0;
        return {
          label,
          value,
          extra: b.validated,
        };
      });

    const monthlyDod = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        let dodMonth = 0;
        if (b.lateItems.length > 0) {
          const totalDays = b.lateItems.reduce((sum, d) => {
            const refDate =
              d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
            const diff =
              new Date(d.deliveredDate!).getTime() -
              new Date(refDate).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0);
          dodMonth = totalDays / b.lateItems.length;
        }
        return {
          label,
          value: dodMonth,
          extra: b.lateItems.length,
        };
      });

    type ProjectSynth = {
      projectId: number;
      projectNumber: string | null;
      titleProject: string | null;
      clientName: string | null;
      projectManagerName: string | null;
      status: string | null;
      total: number;
      delivered: number;
      otd: number;
      oqd: number;
      dod: number;
    };

    const byProject = new Map<number, ProjectSynth>();

    for (const d of filtered) {
      const p = d.project;
      if (!p) continue;

      if (!byProject.has(p.id)) {
        byProject.set(p.id, {
          projectId: p.id,
          projectNumber: p.projectNumber,
          titleProject: p.titleProject,
          clientName: p.clientName,
          projectManagerName: p.projectManagerName,
          status: p.status,
          total: 0,
          delivered: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
        });
      }

      const s = byProject.get(p.id)!;
      s.total += 1;
      if (d.deliveredDate) {
        s.delivered += 1;
      }
    }

    const projectBuckets = new Map<
      number,
      {
        deliveredItems: typeof deliveredItems;
        onTime: number;
        evaluated: number;
        validated: number;
        lateItems: typeof lateItems;
      }
    >();

    for (const d of filtered) {
      const p = d.project;
      if (!p) continue;

      if (!projectBuckets.has(p.id)) {
        projectBuckets.set(p.id, {
          deliveredItems: [],
          onTime: 0,
          evaluated: 0,
          validated: 0,
          lateItems: [],
        });
      }

      const b = projectBuckets.get(p.id)!;

      const hasDeadline = d.contractualDate || d.revisedDate;
      if (d.deliveredDate && hasDeadline) {
        b.deliveredItems.push(d);

        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
        const deliveredTime = new Date(d.deliveredDate!).getTime();
        const refTime = new Date(refDate).getTime();

        if (deliveredTime <= refTime) {
          b.onTime += 1;
        } else {
          b.lateItems.push(d);
        }

        const isEvaluated =
          d.status === "Validé" || d.status === "Refusé";
        if (isEvaluated) {
          b.evaluated += 1;
          if (d.status === "Validé") {
            b.validated += 1;
          }
        }
      }
    }

    for (const [projectId, bucket] of projectBuckets.entries()) {
      const s = byProject.get(projectId);
      if (!s) continue;

      s.otd = bucket.deliveredItems.length
        ? (bucket.onTime / bucket.deliveredItems.length) * 100
        : 0;
      s.oqd = bucket.evaluated
        ? (bucket.validated / bucket.evaluated) * 100
        : 0;

      if (bucket.lateItems.length > 0) {
        const totalDays = bucket.lateItems.reduce((sum, d) => {
          const refDate =
            d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
          const diff =
            new Date(d.deliveredDate!).getTime() -
            new Date(refDate).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        s.dod = totalDays / bucket.lateItems.length;
      } else {
        s.dod = 0;
      }
    }

    const projectsSynth = Array.from(byProject.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });

    return NextResponse.json({
      deliverables: filtered,
      kpi,
      monthly: {
        count: monthlyCount,
        otd: monthlyOtd,
        oqd: monthlyOqd,
        dod: monthlyDod,
      },
      projectsSynth,
    });
  } catch (e: any) {
    console.error("Error loading global deliverables", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des livrables globaux." },
      { status: 500 },
    );
  }
}
