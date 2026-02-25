import { AnnouncementsPanel } from "@/components/announcements-panel";

export default function StaffAnnouncementsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
                <h1 className="text-2xl font-bold tracking-tight">System Announcements</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage and broadcast mass emails to residents using Staff credentials.</p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "80ms" }}>
                <AnnouncementsPanel roleScope="STAFF" />
            </div>
        </div>
    );
}
