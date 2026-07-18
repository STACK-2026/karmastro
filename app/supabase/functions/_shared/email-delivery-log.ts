export type EmailLogStatus = "pending" | "sent" | "failed" | "skipped_no_key";

type EmailLogInsert = {
  recipient: string;
  type: string;
  subject: string;
  status: EmailLogStatus;
};

type EmailLogUpdate = {
  status: "sent" | "failed";
  error: string | null;
};

type EmailLogResult = {
  data: { id: string } | null;
  error: unknown;
};

export type EmailLogDatabase = {
  from: (table: "email_log") => {
    insert: (values: EmailLogInsert) => {
      select: (columns: "id") => {
        single: () => Promise<EmailLogResult>;
      };
    };
    update: (values: EmailLogUpdate) => {
      eq: (column: "id", value: string) => Promise<{ error: unknown }>;
    };
  };
};

export async function createEmailLogEntry(
  db: EmailLogDatabase,
  values: EmailLogInsert,
): Promise<string | null> {
  try {
    const { data, error } = await db.from("email_log").insert(values).select("id").single();
    if (error) {
      console.warn("[send-email] failed to create email log entry", error);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.warn("[send-email] failed to create email log entry", error);
    return null;
  }
}

export async function completeEmailLogEntry(
  db: EmailLogDatabase,
  id: string | null,
  status: "sent" | "failed",
  failure?: unknown,
): Promise<void> {
  if (!id) return;

  const error = status === "failed" ? String(failure ?? "email_send_failed").slice(0, 500) : null;
  try {
    const { error: updateError } = await db.from("email_log").update({ status, error }).eq("id", id);
    if (updateError) console.warn("[send-email] failed to complete email log entry", updateError);
  } catch (updateError) {
    console.warn("[send-email] failed to complete email log entry", updateError);
  }
}
