import { createLazyFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@features/settings/components/SettingsPage";

export const Route = createLazyFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});
