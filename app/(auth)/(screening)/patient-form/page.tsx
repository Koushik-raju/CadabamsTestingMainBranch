'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/common/back-button';
import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

interface Relationship { id: number; name: string; }

function PatientFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  useEffect(() => {
    crmClient.get(endpoints.GET_RELATIONSHIP_MASTER).then((r) => setRelationships(r.data?.result ?? [])).catch(() => {});
  }, []);

  const handleContinue = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('patientFirstName', firstName);
    params.set('patientLastName', lastName);
    params.set('relationship', relationship);
    router.push(`/date-of-birth?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton />
      <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">Patient information</h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pFirst">First Name</Label>
            <Input id="pFirst" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pLast">Last Name</Label>
            <Input id="pLast" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {relationships.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleContinue} disabled={!firstName || !relationship} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

export default function PatientFormPage() {
  return <Suspense><PatientFormContent /></Suspense>;
}
