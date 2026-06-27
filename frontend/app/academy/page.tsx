import { BarChart3, BookOpen, CheckCircle2, ClipboardCheck, FileText, PlayCircle } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { lessons, type AcademyLesson } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Академия инвестора", description: "Бесплатные материалы об акциях, финансовой отчётности, отраслевом анализе и управлении инвестиционными рисками.", path: "/academy" });

const levels = ["Beginner", "Intermediate", "Advanced"];
const levelLabels: Record<string, string> = {
  Beginner: "База",
  Intermediate: "Анализ",
  Advanced: "Практика",
};

const sources = [
  "Lecture 1.pdf: отрасль, рынок, границы, типы отраслей",
  "Lecture 2.pdf: барьеры входа/выхода, модели рынка, конкуренция",
  "03 Value chain.pdf: value chain, life cycle, инвестиционная и финансовая активность",
  "Applied industry analysis part 1.pdf: практический шаблон industry overview",
  "Литература сайта: акции, ETF, дивиденды, фондовый рынок, риск-менеджмент",
];

export default function AcademyPage() {
  const completed = lessons.filter((lesson) => lesson.progress > 0).length;

  return (
    <>
      <PageHeader title="Обучение" subtitle="Курс по инвестициям и отраслевому анализу на основе лекций и базовой литературы сайта." />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Программа">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={<BookOpen size={18} />} label="Уроков" value={lessons.length.toString()} />
            <Metric icon={<CheckCircle2 size={18} />} label="Начато" value={`${completed}/${lessons.length}`} />
            <Metric icon={<BarChart3 size={18} />} label="Фокус" value="Industry analysis" />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#344054]">
            Академия теперь ведет пользователя от базовых инвестиционных понятий к прикладному отраслевому анализу:
            сначала акции, ETF и рынок, затем границы отрасли, барьеры, конкурентная структура, value chain и жизненный цикл.
          </p>
        </Panel>

        <Panel title="Источники">
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source} className="flex gap-2 rounded-2xl border border-[#dde3eb] p-3 text-sm text-[#344054]">
                <FileText size={16} className="mt-0.5 shrink-0 text-[#2563eb]" />
                <span>{source}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {levels.map((level) => (
          <Panel key={level} title={levelLabels[level]}>
            <div className="space-y-3">
              {lessons.filter((lesson) => lesson.level === level).map((lesson) => (
                <LessonCard key={lesson.title} lesson={lesson} />
              ))}
              {lessons.filter((lesson) => lesson.level === level).length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dde3eb] p-4 text-sm text-[#667085]">
                  <BookOpen className="mb-2" size={18} />
                  Уроки появятся после MVP.
                </div>
              )}
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Финальный мини-проект" action={<ClipboardCheck size={18} className="text-[#2563eb]" />} className="mt-4">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-base font-semibold">Industry outlook для выбранной отрасли</h2>
            <p className="mt-2 text-sm leading-6 text-[#344054]">
              Пользователь выбирает отрасль, например AI chips, e-commerce, cloud, fintech или oil & gas, и собирает короткий
              инвестиционный обзор по шаблону из лекций.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Описание отрасли и бизнес-моделей",
              "Границы рынка и тип отрасли",
              "Барьеры входа и модель конкуренции",
              "CAGR, маржи, ROE, ROA, ROCE",
              "Ключевые игроки и market share",
              "Value chain, life cycle и риски",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#dde3eb] bg-[#fbfcfe] p-3 text-sm text-[#344054]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </>
  );
}

function LessonCard({ lesson }: { lesson: AcademyLesson }) {
  return (
    <article className="rounded-2xl border border-[#dde3eb] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold leading-5">{lesson.title}</h2>
          <p className="mt-1 text-xs text-[#667085]">{lesson.duration} · {lesson.source}</p>
        </div>
        {lesson.progress === 100 ? <CheckCircle2 size={18} className="shrink-0 text-[#0f9f6e]" /> : <PlayCircle size={18} className="shrink-0 text-[#2563eb]" />}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#344054]">{lesson.summary}</p>
      <div className="mt-3 h-2 rounded-full bg-[#eef2f6]">
        <div className="h-2 rounded-full bg-[#2563eb]" style={{ width: `${lesson.progress}%` }} />
      </div>
      <div className="mt-3 space-y-2">
        {lesson.outcomes.map((outcome) => (
          <div key={outcome} className="flex gap-2 text-xs leading-5 text-[#344054]">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#0f9f6e]" />
            <span>{outcome}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-[#fff7ed] p-3 text-xs leading-5 text-[#9a3412]">
        Практика: {lesson.practice}
      </div>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dde3eb] bg-[#fbfcfe] p-3">
      <div className="flex items-center gap-2 text-[#2563eb]">
        {icon}
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
