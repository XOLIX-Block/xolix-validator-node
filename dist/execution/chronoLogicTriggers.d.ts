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
export declare class XolixChronoLogicEngine {
    private scheduledTriggers;
    registerChronoTrigger(targetContract: string, methodName: string, triggerBlockNumber: number, repeatIntervalBlocks?: number): ScheduledTrigger;
    processBlockTriggers(currentBlock: number): ScheduledTrigger[];
}
