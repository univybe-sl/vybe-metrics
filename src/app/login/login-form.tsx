"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField name="password" type="password" isRequired autoFocus className="flex flex-col gap-1.5">
        <Label>Password</Label>
        <Input placeholder="Enter dashboard password" />
      </TextField>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" fullWidth isDisabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
