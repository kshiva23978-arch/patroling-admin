import Link from "next/link";
import { listActivityCategories } from "@/lib/resources/activity-categories";
import { primaryButtonClass } from "@/lib/ui-classes";
import { ActivityCategoriesTable } from "./ActivityCategoriesTable";


export default async function ActivityCategoriespage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string;}>;
}) {
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;
    const listing = await listActivityCategories(currentPage);



    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Activity Categories</h1>
                <Link href="/activity-categories/new" className={primaryButtonClass}>
                    New Activity Category
                </Link>
            </div>
            <ActivityCategoriesTable data={listing} />
        </div>
    )
}
