import type { Submission } from "@/lib/hackathon-admin";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${status === "approved" ? "border-accent/25 bg-accent/10 text-accent" : status === "rejected" ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-hairline bg-secondary text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
export function SubmissionDetails({ row }: { row: Submission }) {
  return (
    <div className="space-y-5 border-t border-hairline pt-5 text-sm">
      <p className="break-words">
        <strong>Team lead:</strong> {row.leader} · {row.email}
      </p>
      <p>
        <strong>Track:</strong> {row.track}
      </p>
      {!row.details.length && (
        <p className="whitespace-pre-wrap break-words">
          {row.idea || "No idea content was submitted."}
        </p>
      )}
      {row.details.map((detail) => (
        <div key={detail.label}>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {detail.label}
          </h3>
          <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{detail.value}</p>
        </div>
      ))}
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Presentation & project attachments
      </h3>
      {!row.links.length && (
        <p className="text-muted-foreground">No presentation or attachment links were submitted.</p>
      )}
      <div className="flex flex-wrap gap-4">
        {row.links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline underline-offset-4"
          >
            {link.label} ↗
          </a>
        ))}
      </div>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Member personal details · {row.members.length}/4
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {row.members.map((member, i) => (
          <li key={`${member.email}-${i}`} className="rounded-xl bg-secondary/50 p-4">
            <p className="font-medium">{member.name}</p>
            <p className="break-all text-muted-foreground">{member.email}</p>
            <p className="mt-1 text-xs font-medium">{member.role}</p>
            <dl className="mt-3 space-y-2 text-xs">
              {[
                ["Contact number", member.phone],
                ["USN / SRN", member.usn],
                ["College", member.college],
                ["Branch", member.branch],
                ["Year", member.year],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 break-words">{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {row.members.length !== 4 && (
        <p className="text-destructive">This team needs exactly 4 members before approval.</p>
      )}
      {row.phone && <p>Leader phone: {row.phone}</p>}
      {row.reviewedAt && (
        <p className="text-muted-foreground">
          Reviewed {new Date(row.reviewedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{" "}
          IST
        </p>
      )}
      {row.reviewNote && <p className="whitespace-pre-wrap">Reviewer’s note: {row.reviewNote}</p>}
    </div>
  );
}
