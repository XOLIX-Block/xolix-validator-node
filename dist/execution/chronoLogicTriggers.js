"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixChronoLogicEngine = void 0;
class XolixChronoLogicEngine {
    scheduledTriggers = new Map();
    registerChronoTrigger(targetContract, methodName, triggerBlockNumber, repeatIntervalBlocks) {
        const triggerId = `XBC_CLT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const trigger = {
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
    processBlockTriggers(currentBlock) {
        const executed = [];
        for (const [id, trigger] of this.scheduledTriggers.entries()) {
            if (trigger.isActive && currentBlock >= trigger.triggerBlockNumber) {
                executed.push(trigger);
                if (trigger.repeatIntervalBlocks && trigger.repeatIntervalBlocks > 0) {
                    trigger.triggerBlockNumber = currentBlock + trigger.repeatIntervalBlocks;
                }
                else {
                    trigger.isActive = false;
                }
            }
        }
        return executed;
    }
}
exports.XolixChronoLogicEngine = XolixChronoLogicEngine;
