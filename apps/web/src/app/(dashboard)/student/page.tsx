
'use client';

import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="grid gap-4 md:grid-cols-3">
     {/* Welcome Message could be a card or banner if needed, but sidebar has user info now */}
          {/* Apply / Lease Status */}
          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-between">
            <div>
                 <h2 className="text-xl font-semibold mb-4">Lease Status</h2>
                <p className="text-muted-foreground italic">No active lease found.</p>
            </div>
            <Link href="/student/application">
              <button className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90">
                Apply for Housing
              </button>
            </Link>
          </div>

          {/* Maintenance */}
          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-between">
            <div>
                <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
                <p className="text-muted-foreground italic">No open requests.</p>
            </div>
            <button className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90">
              New Request
            </button>
          </div>

          {/* Payments */}
          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-between">
            <div>
                <h2 className="text-xl font-semibold mb-4">Finances</h2>
                <div className="flex justify-between items-center mb-2">
                <span>Balance Due:</span>
                <span className="font-bold text-destructive">$0.00</span>
                </div>
            </div>
            <button className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90">
              Make Payment
            </button>
          </div>
    </div>
  );
}
