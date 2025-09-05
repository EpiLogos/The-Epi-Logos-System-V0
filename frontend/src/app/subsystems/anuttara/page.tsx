"use client";

import React from "react";
import SubsystemScenePage from "@/components/subsystems/SubsystemScenePage";
import { subsystemById } from "@/lib/constants/subsystems";

export default function Page() {
  const subsystem = subsystemById("anuttara");
  return <SubsystemScenePage subsystem={subsystem} />;
}

