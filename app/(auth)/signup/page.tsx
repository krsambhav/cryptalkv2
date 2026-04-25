"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, App } from "antd";
import { signUpWithEmail } from "@/lib/firebase";
import { Wordmark } from "@/components/brand/Wordmark";

interface FormValues {
  displayName: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    try {
      await signUpWithEmail(values.email.trim(), values.password, values.displayName.trim());
      message.success("account created");
      router.push("/chats");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not sign up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Wordmark size="sm" className="lg:hidden mb-10" />

      <p className="text-xs uppercase tracking-[0.22em] text-muted">first time here</p>
      <h1 className="font-display text-4xl mt-2 text-balance">Set up an account.</h1>
      <p className="mt-3 text-text-2 text-sm text-pretty">
        We never store your conversation passphrases — they live only in your browser tab. The
        account here is for routing messages, not for unlocking them.
      </p>

      <Form<FormValues>
        layout="vertical"
        size="large"
        className="mt-10"
        onFinish={onFinish}
        autoComplete="on"
      >
        <Form.Item
          name="displayName"
          label="Display name"
          rules={[{ required: true, min: 1, max: 80 }]}
        >
          <Input autoComplete="name" placeholder="Ada Lovelace" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: "email", message: "valid email please" }]}
        >
          <Input autoComplete="email" placeholder="ada@analytical.engine" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, min: 6, message: "at least 6 characters" }]}
          extra={<span className="text-xs text-muted">used only for sign-in. not used to derive any encryption key.</span>}
        >
          <Input.Password autoComplete="new-password" placeholder="•••••••••" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          block
          className="mt-2 h-12 font-medium"
        >
          Create account
        </Button>
      </Form>

      <p className="mt-8 text-sm text-text-2">
        Already have one?{" "}
        <Link className="text-accent underline-offset-4 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
