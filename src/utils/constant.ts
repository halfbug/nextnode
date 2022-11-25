import { freemem } from 'os';
import { BillingTierEnum } from 'src/stores/entities/store.entity';

export const TEST = 'test';
export const GS_CHARGE_CASHBACK = 10;
export const GS_CHARGE_FEE_LAUNCH = 0.25;
export const GS_CHARGE_FEE_GROWTH = 0.2;
export const GS_CHARGE_FEE_ENTERPRISE = 0.1;
// export const GS_CHARGE_FEE_CURRENCY_CODE = 'cent';
export const GS_PLAN1_START_COUNT = 1;
export const GS_PLAN1_END_COUNT = 100;
export const GS_PLAN2_START_COUNT = 101;
export const GS_PLAN2_END_COUNT = 1000;
export const GS_PLAN3_START_COUNT = 1001;
export const GS_PLAN3_END_COUNT = 2500;
export const GS_PLAN4_START_COUNT = 2501;

export const GS_FEES = [
  0,
  GS_CHARGE_FEE_LAUNCH,
  GS_CHARGE_FEE_GROWTH,
  GS_CHARGE_FEE_ENTERPRISE,
];

export const FIRST_EXPIRE_DAYS = 14;
export const SECOND_EXPIRE_DAYS = 7;

export const GS_TIER0_START_COUNT = 1; //FREE
export const GS_TIER0_END_COUNT = 3;
export const GS_TIER1_START_COUNT = 4; // Tier 1 4-5 pgs
export const GS_TIER1_END_COUNT = 5;
export const GS_TIER2_START_COUNT = 6; // Tier 2 6-10 pgs
export const GS_TIER2_END_COUNT = 10;
export const GS_TIER3_START_COUNT = 11; // Tier 3 11-25 pgs
export const GS_TIER3_END_COUNT = 25;
export const GS_TIER4_START_COUNT = 26;
export const GS_TIER4_END_COUNT = 50;
export const GS_TIER5_START_COUNT = 51;
export const GS_TIER5_END_COUNT = 100;
export const GS_TIER6_START_COUNT = 101;

export const GSP_CHARGE_TIER1 = 50;
export const GSP_CHARGE_TIER2 = 50;
export const GSP_CHARGE_TIER3 = 150;
export const GSP_CHARGE_TIER4 = 250;
export const GSP_CHARGE_TIER5 = 500;
export const GSP_CHARGE_TIER6 = 1500;
export const GSP_FEES = [
  0,
  GSP_CHARGE_TIER2,
  GSP_CHARGE_TIER3,
  GSP_CHARGE_TIER4,
  GSP_CHARGE_TIER5,
  GSP_CHARGE_TIER6,
];
export const GSP_FEES1 = [
  { index: 0, name: BillingTierEnum.FREE, fee: 0, limit: '3' },
  { index: 1, name: BillingTierEnum.TIER1, fee: 50, limit: '5' },
  { index: 2, name: BillingTierEnum.TIER2, fee: 100, limit: '10' },
  { index: 3, name: BillingTierEnum.TIER3, fee: 250, limit: '25' },
  { index: 4, name: BillingTierEnum.TIER4, fee: 500, limit: '50' },
  { index: 5, name: BillingTierEnum.TIER5, fee: 1000, limit: '100' },
  { index: 6, name: BillingTierEnum.TIER6, fee: 2500, limit: '100+' },
];

export const GSP_SWITCH_NUM = [
  GS_TIER1_START_COUNT,
  GS_TIER2_START_COUNT,
  GS_TIER3_START_COUNT,
  GS_TIER4_START_COUNT,
  GS_TIER5_START_COUNT,
  GS_TIER6_START_COUNT,
];

const GS_CHARGE_PARTNER_COMISSION = 10;
// find totalcount < PARTNER_Billing.gsNum
