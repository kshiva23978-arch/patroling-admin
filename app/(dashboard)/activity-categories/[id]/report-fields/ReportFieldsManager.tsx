"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ReportField, ReportFieldGroup } from "@/lib/resources/activity-report-fields";
import {
  reportFieldDefaults,
  reportFieldGroupDefaults,
  type ReportFieldInput,
  type ReportFieldInputType,
} from "@/lib/schemas/activity-report-fields";
import type { ActionResult } from "@/lib/action-result";
import {
  badgeClass,
  cardClass,
  dangerButtonClass,
  errorTextClass,
  inputClass,
  labelClass,
  linkButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui-classes";
import {
  createReportFieldAction,
  createReportFieldGroupAction,
  deleteReportFieldAction,
  deleteReportFieldGroupAction,
  toggleReportFieldActiveAction,
  updateReportFieldAction,
  updateReportFieldGroupAction,
} from "./actions";

const INPUT_TYPE_LABELS: Record<ReportFieldInputType, string> = {
  text: "Text",
  number: "Number",
  boolean: "Yes/No",
  dropdown: "Dropdown",
  date: "Date",
  time: "Time",
  photo: "Photo",
};

function toFormInput(field: ReportField): ReportFieldInput {
  return {
    fieldName: field.field_name,
    inputType: field.input_type,
    options: field.options,
    isRequired: field.is_required,
    isActive: field.is_active,
  };
}

export function ReportFieldsManager({
  categoryId,
  groups,
  fields,
}: {
  categoryId: string;
  groups: ReportFieldGroup[];
  fields: ReportField[];
}) {
  return (
    <div className="space-y-8">
      <div className={`space-y-4 p-4 ${cardClass}`}>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Report Fields</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            One-off fields filled in once per report (e.g. &quot;Total Collection (kg)&quot;).
          </p>
        </div>
        <FieldList categoryId={categoryId} groupId={null} fields={fields} emptyMessage="No report fields yet." />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Repeatable Groups</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            A section the ranger can add multiple entries of (e.g. one row per garbage type collected).
          </p>
        </div>
        {groups.map((group) => (
          <GroupCard key={group.id} categoryId={categoryId} group={group} />
        ))}
        <NewGroupForm categoryId={categoryId} />
      </div>
    </div>
  );
}

function GroupCard({ categoryId, group }: { categoryId: string; group: ReportFieldGroup }) {
  const [isPending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string | null>(null);

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateReportFieldGroupAction(categoryId, group.id, { name });
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      toast.success("Group renamed.");
      setEditingName(false);
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete the group "${group.name}" and all its fields? This action cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteReportFieldGroupAction(categoryId, group.id);
      if (result.success) {
        toast.success("Group deleted.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className={`space-y-4 p-4 ${cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        {editingName ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <input
              className={inputClass}
              value={name}
              disabled={isPending}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button type="submit" className={primaryButtonClass} disabled={isPending || !name.trim()}>
              Save
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={isPending}
              onClick={() => {
                setEditingName(false);
                setName(group.name);
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h3 className="font-medium text-zinc-900">{group.name}</h3>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={linkButtonClass} disabled={isPending} onClick={() => setEditingName(true)}>
                Rename
              </button>
              <button type="button" className={dangerButtonClass} disabled={isPending} onClick={handleDelete}>
                Delete Group
              </button>
            </div>
          </>
        )}
      </div>
      {error && <p className={errorTextClass}>{error}</p>}

      <FieldList
        categoryId={categoryId}
        groupId={group.id}
        fields={group.fields}
        emptyMessage="No fields in this group yet."
      />
    </div>
  );
}

function NewGroupForm({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(reportFieldGroupDefaults.name);
  const [error, setError] = useState<string | null>(null);

  if (!showForm) {
    return (
      <button type="button" className={secondaryButtonClass} onClick={() => setShowForm(true)}>
        Add Group
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await createReportFieldGroupAction(categoryId, { name });
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      toast.success("Group added.");
      setName("");
      setShowForm(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 p-4 ${cardClass}`}>
      {error && <p className={errorTextClass}>{error}</p>}
      <div className="space-y-1">
        <label className={labelClass}>Group Name</label>
        <input
          className={inputClass}
          value={name}
          disabled={isPending}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Collected Items"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButtonClass} disabled={isPending || !name.trim()}>
          {isPending ? "Saving…" : "Add Group"}
        </button>
        <button type="button" className={secondaryButtonClass} disabled={isPending} onClick={() => setShowForm(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function FieldList({
  categoryId,
  groupId,
  fields,
  emptyMessage,
}: {
  categoryId: string;
  groupId: string | null;
  fields: ReportField[];
  emptyMessage: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleToggleActive = (field: ReportField) => {
    startTransition(async () => {
      const result = await toggleReportFieldActiveAction(categoryId, field.id, toFormInput(field));
      if (result.success) {
        toast.success(field.is_active ? "Field disabled." : "Field enabled.");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (field: ReportField) => {
    if (!window.confirm(`Delete field "${field.field_name}"?`)) return;
    startTransition(async () => {
      const result = await deleteReportFieldAction(categoryId, field.id);
      if (result.success) {
        toast.success("Field deleted.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {!showNewForm && (
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setEditingId(null);
              setShowNewForm(true);
            }}
          >
            Add Field
          </button>
        )}
      </div>

      {showNewForm && (
        <FieldForm
          key="new"
          defaultValues={reportFieldDefaults}
          onCancel={() => setShowNewForm(false)}
          onSubmit={(values) => createReportFieldAction(categoryId, groupId, values)}
          onSaved={() => setShowNewForm(false)}
          submitLabel="Add Field"
        />
      )}

      <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
        {fields.length === 0 && !showNewForm && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">{emptyMessage}</p>
        )}

        {fields.map((field) =>
          editingId === field.id ? (
            <div key={field.id} className="bg-zinc-50 p-4">
              <FieldForm
                defaultValues={toFormInput(field)}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) => updateReportFieldAction(categoryId, field.id, values)}
                onSaved={() => setEditingId(null)}
                submitLabel="Save Changes"
              />
            </div>
          ) : (
            <div key={field.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{field.field_name}</span>
                  <span className={badgeClass(field.is_active)}>{field.is_active ? "Active" : "Disabled"}</span>
                  {field.is_required && <span className="text-xs font-medium text-red-600">Required</span>}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {INPUT_TYPE_LABELS[field.input_type]}
                  {field.input_type === "dropdown" && field.options.length > 0 && ` — ${field.options.join(", ")}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className={linkButtonClass}
                  disabled={isPending}
                  onClick={() => {
                    setShowNewForm(false);
                    setEditingId(field.id);
                  }}
                >
                  Edit
                </button>
                <button type="button" className={linkButtonClass} disabled={isPending} onClick={() => handleToggleActive(field)}>
                  {field.is_active ? "Disable" : "Enable"}
                </button>
                <button type="button" className={dangerButtonClass} disabled={isPending} onClick={() => handleDelete(field)}>
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function FieldForm({
  defaultValues,
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
}: {
  defaultValues: ReportFieldInput;
  onSubmit: (values: ReportFieldInput) => Promise<ActionResult>;
  onSaved: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [fieldName, setFieldName] = useState(defaultValues.fieldName);
  const [inputType, setInputType] = useState<ReportFieldInputType>(defaultValues.inputType);
  const [options, setOptions] = useState<string[]>(defaultValues.options);
  const [optionDraft, setOptionDraft] = useState("");
  const [isRequired, setIsRequired] = useState(defaultValues.isRequired);
  const [isActive, setIsActive] = useState(defaultValues.isActive);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const addOption = () => {
    const value = optionDraft.trim();
    if (!value || options.includes(value)) return;
    setOptions([...options, value]);
    setOptionDraft("");
  };

  const removeOption = (value: string) => setOptions(options.filter((o) => o !== value));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOptionsError(null);
    startTransition(async () => {
      const result = await onSubmit({ fieldName, inputType, options, isRequired, isActive });
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        setOptionsError(result.fieldErrors?.options?.[0] ?? null);
        return;
      }
      toast.success("Saved.");
      onSaved();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-200 p-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-1">
        <label className={labelClass}>Field Name</label>
        <input
          className={inputClass}
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Type of Garbage"
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Input Type</label>
        <select
          className={inputClass}
          value={inputType}
          disabled={isPending}
          onChange={(e) => setInputType(e.target.value as ReportFieldInputType)}
        >
          {Object.entries(INPUT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {inputType === "dropdown" && (
        <div className="space-y-1">
          <label className={labelClass}>Options</label>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <span
                key={opt}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {opt}
                <button
                  type="button"
                  onClick={() => removeOption(opt)}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-zinc-700"
                  aria-label={`Remove ${opt}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={optionDraft}
              disabled={isPending}
              placeholder="Add an option and press Enter"
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
            />
            <button type="button" className={secondaryButtonClass} disabled={isPending} onClick={addOption}>
              Add
            </button>
          </div>
          {optionsError && <p className={errorTextClass}>{optionsError}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            checked={isRequired}
            disabled={isPending}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          <span className={labelClass}>Required</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            checked={isActive}
            disabled={isPending}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className={labelClass}>Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className={primaryButtonClass} disabled={isPending || !fieldName.trim()}>
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button type="button" className={secondaryButtonClass} disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
