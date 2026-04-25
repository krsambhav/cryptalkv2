"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, App } from "antd";
import { signInWithEmail } from "@/lib/firebase";
import { Wordmark } from "@/components/brand/Wordmark";

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    try {
      await signInWithEmail(values.email.trim(), values.password);
      message.success("welcome back");
      router.push("/chats");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Wordmark size="sm" className="lg:hidden mb-10" />

      <p className="text-xs uppercase tracking-[0.22em] text-muted">welcome back</p>
      <h1 className="font-display text-4xl mt-2 text-balance">Sign in to read your sealed mail.</h1>
      <p className="mt-3 text-text-2 text-sm">
        Your in-memory keys are gone — re-enter your conversation passphrases after this.
      </p>

      <Form<FormValues>
        layout="vertical"
        size="large"
        className="mt-10"
        onFinish={onFinish}
        autoComplete="on"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: "email", message: "valid email please" }]}
        >
          <Input autoComplete="email" placeholder="you@somewhere.fyi" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, min: 6, message: "at least 6 characters" }]}
        >
          <Input.Password autoComplete="current-password" placeholder="•••••••••" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          block
          className="mt-2 h-12 font-medium"
        >
          Sign in
        </Button>
      </Form>

      <p className="mt-8 text-sm text-text-2">
        New here?{" "}
        <Link className="text-accent underline-offset-4 hover:underline" href="/signup">
          Make an account
        </Link>
      </p>
    </div>
  );
}
