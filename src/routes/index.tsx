import { createFileRoute } from "@tanstack/react-router";
import { QcApp } from "@/components/qc-app";

export const Route = createFileRoute("/")({ component: QcApp });
