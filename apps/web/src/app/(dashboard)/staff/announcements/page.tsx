import { AnnouncementsPanel } from "@/components/announcements-panel";

export default function StaffAnnouncementsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">System Announcements</h1>
                <p className="text-muted-foreground">Manage and broadcast mass emails to residents using Staff credentials.</p>
            </div>
            <AnnouncementsPanel roleScope="STAFF" />
        </div>
    );
}
