import { Lead } from '../models/lead';

export type Condition =
  | { field: 'source';  operator: 'equals' | 'contains'; value: string }
  | { field: 'email';   operator: 'exists' | 'not_exists' }
  | { field: 'phone';   operator: 'exists' | 'not_exists' }
  | { field: 'name';    operator: 'contains'; value: string }
  | { field: 'data';    operator: 'has_key';  key: string }
  | { field: 'data';    operator: 'key_equals'; key: string; value: string };

export type ActionType =
  | 'send_admin_email'
  | 'send_welcome_email'
  | 'send_admin_whatsapp'
  | 'push_to_hubspot'
  | 'push_to_webhook';

export interface Action {
  type: ActionType;
  params?: Record<string, any>;   // e.g. { url: '...' } for push_to_webhook
}

export interface Rule {
  name: string;
  conditions: Condition[];          // ALL must match (AND logic)
  actions: Action[];
  enabled?: boolean;
}

function evalCondition(condition: Condition, lead: Lead): boolean {
  const data = (lead.data as Record<string, any>) || {};

  switch (condition.field) {
    case 'source':
      if (condition.operator === 'equals')   return lead.source === condition.value;
      if (condition.operator === 'contains') return (lead.source || '').includes(condition.value);
      break;

    case 'email':
      if (condition.operator === 'exists')     return !!lead.email;
      if (condition.operator === 'not_exists') return !lead.email;
      break;

    case 'phone':
      if (condition.operator === 'exists')     return !!lead.phone;
      if (condition.operator === 'not_exists') return !lead.phone;
      break;

    case 'name':
      if (condition.operator === 'contains') return lead.name.includes(condition.value);
      break;

    case 'data':
      if (condition.operator === 'has_key')    return condition.key in data;
      if (condition.operator === 'key_equals') return data[condition.key] === condition.value;
      break;
  }
  return false;
}

export function matchingRules(rules: Rule[], lead: Lead): Rule[] {
  return rules.filter(
    (rule) =>
      rule.enabled !== false &&
      rule.conditions.every((c) => evalCondition(c, lead))
  );
}
