#!/bin/bash

###############################################################################
# Comprehensive Performance Test Suite for Minimoonoir GCP Deployment
#
# Tests:
# 1. Embedding API load testing (cold start, warm latency, sustained load)
# 2. Cloud Storage access performance (gs://minimoonoir-vectors)
# 3. Nostr Relay WebSocket performance (connection, throughput, concurrency)
#
# Outputs:
# - JSON reports for each test
# - HTML reports for visualization
# - Metrics stored in aqe/performance/* namespace
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "${RESULTS_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Minimoonoir Performance Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Timestamp: ${TIMESTAMP}"
echo -e "Results Directory: ${RESULTS_DIR}"
echo ""

###############################################################################
# Test 1: Embedding API Load Testing
###############################################################################

echo -e "${YELLOW}[1/3] Running Embedding API Load Tests...${NC}"
echo -e "Target: https://embedding-api-617806532906.us-central1.run.app"
echo ""

artillery run \
  --output "${RESULTS_DIR}/embedding-api-${TIMESTAMP}.json" \
  "${SCRIPT_DIR}/embedding-api-load-test.yaml"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Embedding API tests completed${NC}"

  # Generate HTML report
  artillery report \
    --output "${RESULTS_DIR}/embedding-api-${TIMESTAMP}.html" \
    "${RESULTS_DIR}/embedding-api-${TIMESTAMP}.json"

  echo -e "${GREEN}✓ Report generated: ${RESULTS_DIR}/embedding-api-${TIMESTAMP}.html${NC}"
else
  echo -e "${RED}✗ Embedding API tests failed${NC}"
fi

echo ""

###############################################################################
# Test 2: Cloud Storage Access Performance
###############################################################################

echo -e "${YELLOW}[2/3] Running Cloud Storage Access Tests...${NC}"
echo -e "Target: https://storage.googleapis.com/minimoonoir-vectors"
echo ""

artillery run \
  --output "${RESULTS_DIR}/cloud-storage-${TIMESTAMP}.json" \
  "${SCRIPT_DIR}/cloud-storage-test.yaml"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Cloud Storage tests completed${NC}"

  artillery report \
    --output "${RESULTS_DIR}/cloud-storage-${TIMESTAMP}.html" \
    "${RESULTS_DIR}/cloud-storage-${TIMESTAMP}.json"

  echo -e "${GREEN}✓ Report generated: ${RESULTS_DIR}/cloud-storage-${TIMESTAMP}.html${NC}"
else
  echo -e "${RED}✗ Cloud Storage tests failed${NC}"
fi

echo ""

###############################################################################
# Test 3: Nostr Relay WebSocket Performance
###############################################################################

echo -e "${YELLOW}[3/3] Running Nostr Relay WebSocket Tests...${NC}"
echo -e "Target: wss://nostr-relay-617806532906.us-central1.run.app"
echo ""

artillery run \
  --output "${RESULTS_DIR}/nostr-relay-${TIMESTAMP}.json" \
  "${SCRIPT_DIR}/nostr-relay-websocket-test.yaml"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Nostr Relay tests completed${NC}"

  artillery report \
    --output "${RESULTS_DIR}/nostr-relay-${TIMESTAMP}.html" \
    "${RESULTS_DIR}/nostr-relay-${TIMESTAMP}.json"

  echo -e "${GREEN}✓ Report generated: ${RESULTS_DIR}/nostr-relay-${TIMESTAMP}.html${NC}"
else
  echo -e "${RED}✗ Nostr Relay tests failed${NC}"
fi

echo ""

###############################################################################
# Summary Report
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Performance Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "All test results saved to: ${RESULTS_DIR}"
echo ""
echo -e "${GREEN}HTML Reports:${NC}"
ls -1 "${RESULTS_DIR}"/*.html 2>/dev/null | tail -3 | while read file; do
  echo -e "  - file://${file}"
done
echo ""
echo -e "${GREEN}JSON Data:${NC}"
ls -1 "${RESULTS_DIR}"/*.json 2>/dev/null | tail -3 | while read file; do
  echo -e "  - ${file}"
done
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Open HTML reports in browser for visualization"
echo -e "2. Analyze JSON data for detailed metrics"
echo -e "3. Store results in aqe/performance/* namespace"
echo -e "4. Generate optimization recommendations"
echo ""
echo -e "${GREEN}Performance testing complete!${NC}"
