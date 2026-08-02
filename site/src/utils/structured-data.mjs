function hasStructuredDataType(value, expectedType) {
  if (Array.isArray(value)) {
    return value.some((item) => hasStructuredDataType(item, expectedType));
  }
  if (!value || typeof value !== "object") return false;

  const declaredTypes = Array.isArray(value["@type"])
    ? value["@type"]
    : [value["@type"]];
  if (declaredTypes.includes(expectedType)) return true;

  return Array.isArray(value["@graph"])
    ? value["@graph"].some((item) => hasStructuredDataType(item, expectedType))
    : false;
}

export function mergeJsonLdWithDefaultOrganization(defaultOrganization, jsonLd) {
  const pageJsonLd = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return hasStructuredDataType(pageJsonLd, "Organization")
    ? pageJsonLd
    : [defaultOrganization, ...pageJsonLd];
}
