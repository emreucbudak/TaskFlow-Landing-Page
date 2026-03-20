import type { ApiCompanyPlan } from "./types";
import { toRecord, getNumberByAliases, getBooleanByAliases } from "./utils";

export const parseApiPlans = (payload: unknown): ApiCompanyPlan[] => {
  const payloadRecord = toRecord(payload);
  const dataRecord = toRecord(payloadRecord.data);
  const itemsRecord = toRecord(payloadRecord.items);
  const resultRecord = toRecord(payloadRecord.result);
  const valueRecord = toRecord(payloadRecord.value);
  const rawArray =
    Array.isArray(payload) ? payload :
      Array.isArray(payloadRecord.$values) ? payloadRecord.$values :
        Array.isArray(payloadRecord.data) ? payloadRecord.data :
          Array.isArray(dataRecord.$values) ? dataRecord.$values :
            Array.isArray(payloadRecord.items) ? payloadRecord.items :
              Array.isArray(itemsRecord.$values) ? itemsRecord.$values :
                Array.isArray(payloadRecord.result) ? payloadRecord.result :
                  Array.isArray(resultRecord.$values) ? resultRecord.$values :
                    Array.isArray(payloadRecord.value) ? payloadRecord.value :
                      Array.isArray(valueRecord.$values) ? valueRecord.$values :
                        [];

  return rawArray
    .map((item) => {
      const raw = toRecord(item);
      const rawProperties = toRecord(raw.planProperties ?? raw.PlanProperties ?? raw.properties ?? raw.Properties);
      const planNameValue = raw.planName ?? raw.PlanName ?? raw.name ?? raw.Name;
      const planName = typeof planNameValue === "string" ? planNameValue : undefined;
      const planPrice = Number(raw.planPrice ?? raw.PlanPrice ?? raw.price ?? raw.Price);
      if (!planName || Number.isNaN(planPrice)) return null;

      const peopleAddedLimit = getNumberByAliases(rawProperties, ["peopleAddedLimit", "PeopleAddedLimit", "workerAddedLimit", "WorkerAddedLimit"]);
      const teamLimit = getNumberByAliases(rawProperties, ["teamLimit", "TeamLimit"]);
      const individualTaskLimit = getNumberByAliases(rawProperties, ["individualTaskLimit", "IndividualTaskLimit", "taskLimit", "TaskLimit"]);
      const isInternalReportingEnabled = getBooleanByAliases(rawProperties, ["isInternalReportingEnabled", "IsInternalReportingEnabled", "isReportIncluded", "IsReportIncluded"]);

      const hasProperties = ![peopleAddedLimit, teamLimit, individualTaskLimit].some(Number.isNaN);

      const result: ApiCompanyPlan = { planName, planPrice };
      if (hasProperties) {
        result.planProperties = { peopleAddedLimit, teamLimit, individualTaskLimit, isInternalReportingEnabled };
      }
      return result;
    })
    .filter((plan): plan is ApiCompanyPlan => plan !== null);
};
