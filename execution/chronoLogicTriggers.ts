// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XolixBlock Chrono-Logic Triggers (XBC-CLT)
 * Protocol-native cron execution engine built into the block loop.
 * Automatically triggers smart contract callbacks at precise block intervals without external keeper bots.
 * Version: v1.0.0-QuantumAether
 */
export interface ScheduledTrigger {
  triggerId: string;
  targetContract: string;
  methodName: string;
  triggerBlockNumber: number;
  repeatIntervalBlocks?: number;
  isActive: boolean;
}

export class XolixChronoLogicEngine {
  private scheduledTriggers: Map<string, ScheduledTrigger> = new Map();

  public registerChronoTrigger(
    targetContract: string,
    methodName: string,
    triggerBlockNumber: number,
    repeatIntervalBlocks?: number
  ): ScheduledTrigger {
    const triggerId = `XBC_CLT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const trigger: ScheduledTrigger = {
      triggerId,
      targetContract,
      methodName,
      triggerBlockNumber,
      repeatIntervalBlocks,
      isActive: true,
    };

    this.scheduledTriggers.set(triggerId, trigger);
    return trigger;
  }

  public processBlockTriggers(currentBlock: number): ScheduledTrigger[] {
    const executed: ScheduledTrigger[] = [];

    for (const [id, trigger] of this.scheduledTriggers.entries()) {
      if (trigger.isActive && currentBlock >= trigger.triggerBlockNumber) {
        executed.push(trigger);

        if (trigger.repeatIntervalBlocks && trigger.repeatIntervalBlocks > 0) {
          trigger.triggerBlockNumber = currentBlock + trigger.repeatIntervalBlocks;
        } else {
          trigger.isActive = false;
        }
      }
    }

    return executed;
  }
}
