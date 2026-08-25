"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { CustomField, CustomFieldInputType } from "@/lib/resources/custom-fields";
import { customFieldDefaults, type CustomFieldInput } from "@/lib/schemas/custom-fields";
import {
  badgeClass,
  dangerButtonClass,
  errorTextClass,
  inputClass,
  labelClass,
  linkButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui-classes";
import {
  createCustomFieldAction,
  deleteCustomFieldAction,
  toggleCustomFieldActiveAction,
  updateCustomFieldAction,
} from "./actions";

const INPUT_TYPE_LABELS: Record<CustomFieldInputType, string> = {
  text: "Text",
  boolean: "Yes/No",
  dropdown: "Dropdown",
  time: "Time",
  date: "Date",
  number: "Number",
};

function toFormInput(field: CustomField): CustomFieldInput {
  return {
    fieldName: field.field_name,
    inputType: field.input_type,
    options: field.options,
    isRequired: field.is_required,
    isActive: field.is_active,
  };
}

export function CustomFieldsManager({ rangeId, fields }: { rangeId: string; fields: CustomField[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleToggleActive = (field: CustomField) => {
    startTransition(async () => {
      const result = await toggleCustomFieldActiveAction(field.id, toFormInput(field));
      if (result.success) {
        toast.success(field.is_active ? "Field disabled." : "Field enabled.");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (field: CustomField) => {
    if (!window.confirm(`Delete custom field "${field.field_name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCustomFieldAction(field.id);
      if (result.success) {
        toast.success("Custom field deleted.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Custom Fields</h2>
        {!showNewForm && (
          <button
            type="button"
            className={primaryButtonClass}
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
        <CustomFieldForm
          key="new"
          defaultValues={customFieldDefaults}
          onCancel={() => setShowNewForm(false)}
          onSubmit={async (values) => createCustomFieldAction(rangeId, values)}
          onSaved={() => setShowNewForm(false)}
          submitLabel="Add Field"
        />
      )}

      <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
        {fields.length === 0 && !showNewForm && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            No custom fields configured for this range yet.
          </p>
        )}

        {fields.map((field) =>
          editingId === field.id ? (
            <div key={field.id} className="bg-zinc-50 p-4">
              <CustomFieldForm
                defaultValues={toFormInput(field)}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) => updateCustomFieldAction(field.id, values)}
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
                  {field.is_required && (
                    <span className="text-xs font-medium text-red-600">Required</span>
                  )}
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

function CustomFieldForm({
  defaultValues,
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
}: {
  defaultValues: CustomFieldInput;
  onSubmit: (values: CustomFieldInput) => Promise<{ success: boolean; message?: string; fieldErrors?: Record<string, string[]> }>;
  onSaved: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [fieldName, setFieldName] = useState(defaultValues.fieldName);
  const [inputType, setInputType] = useState<CustomFieldInputType>(defaultValues.inputType);
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
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className={labelClass}>Field Name</label>
        <input
          className={inputClass}
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Type of Conflict"
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Input Type</label>
        <select
          className={inputClass}
          value={inputType}
          disabled={isPending}
          onChange={(e) => setInputType(e.target.value as CustomFieldInputType)}
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
