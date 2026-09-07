import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { ActivityCategoryInput } from "@/lib/schemas/activity-categories";


export interface ActivityCategoryCreatedBy {
    id: string;
    employee_id: string;
    name: string | null;
}

export interface ActivityCategory {
    id: string;
    name: string;
    description: string | null;
    has_report: boolean;
    created_at: string | null;
    updated_at: string | null;
    created_by?: ActivityCategoryCreatedBy | null;
}

function normalizeActivityCategory(category: ActivityCategory): ActivityCategory {
    return {
        ...category,
        has_report: Boolean(category.has_report),
    }
}

export async function listActivityCategories(
    page = 1,
): Promise<Paginated<ActivityCategory>> {
    const params = new URLSearchParams({page: String(page)});
    const result = await apiFetchPaginated<ActivityCategory>(`/admin/activity-categories?${params.toString()}`);
    return {...result, data: result.data.map(normalizeActivityCategory)};
}


export async function getActivityCategory(id: string): Promise<ActivityCategory> {
    const category = await apiFetch<ActivityCategory>(`/admin/activity-categories/${id}`);
    return normalizeActivityCategory(category);
}

export async function deleteActivityCategory(id: string): Promise<void> {
    await apiFetch<void>(`/admin/activity-categories/${id}`, {
        method: "DELETE",
    });
}

function toPayload(input: ActivityCategoryInput) {
    return {
        name: input.name,
        description: input.description || null,
        has_report: input.has_report,
    };
}

export async function createActivityCategory(input: ActivityCategoryInput): Promise<ActivityCategory> {
    const category = await apiFetch<ActivityCategory>("/admin/activity-categories", {
        method: "POST",
        body: JSON.stringify(toPayload(input)),
    });
    return normalizeActivityCategory(category);
}

export async function updateActivityCategory(id: string, input: ActivityCategoryInput): Promise<ActivityCategory> {
    const category = await apiFetch<ActivityCategory>(`/admin/activity-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(toPayload(input)),
    });
    return normalizeActivityCategory(category);
}