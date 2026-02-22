'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fName: '',
    lName: '',
    netId: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    // Min 10, Upper, Lower, Number, Special
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 10 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.');
      setLoading(false);
      return;
    }

    try {
      await authApi.post('/auth/create-new', formData);
      router.push('/login?signup=success');
    } catch (err: any) {
       if (err.response) {
        setError(err.response.data.message || 'Signup failed');
      } else {
        setError('Network error. Please check if auth-server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="fName">First Name</FieldLabel>
                <Input 
                  id="fName" 
                  type="text" 
                  placeholder="John" 
                  required 
                  value={formData.fName}
                  onChange={handleChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lName">Last Name</FieldLabel>
                <Input 
                  id="lName" 
                  type="text" 
                  placeholder="Doe" 
                  required 
                  value={formData.lName}
                  onChange={handleChange}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="netId">NetID</FieldLabel>
              <Input 
                id="netId" 
                type="text" 
                placeholder="netid123" 
                required 
                value={formData.netId}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                defaultValue={formData.role}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input 
                id="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 10 chars, include uppercase, lowercase, number, and special char.
              </p>
            </Field>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
               <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
