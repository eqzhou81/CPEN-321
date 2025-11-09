# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
|                                                           |


## 2. Back-end test specification : APIs

### 2.1.1 API Test Locations and Mocked Components

| **Interface** | **Describe Group Location (No Mocks)** | **Describe Group Location (With Mocks)** | **Mocked Components** |
|----------------|---------------------------------------|------------------------------------------|------------------------|
| **GET /api/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L47](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L47) | [backend/tests/mock/discussions.mocked.test.ts#L76](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L76) | `discussionModel`, `userModel`, `Socket.IO`, `mongoose` |
| **GET /api/discussions/:id** | [backend/tests/unmock/discussions.unmocked.test.ts#L70](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L70) | [backend/tests/mock/discussions.mocked.test.ts#L230](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L230) | `discussionModel.findById`, `userModel.findById` |
| **POST /api/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L120](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L120) | [backend/tests/mock/discussions.mocked.test.ts#L320](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L320) | `discussionModel.create`, `Socket.IO`, `auth.middleware` |
| **POST /api/discussions/:id/messages** | [backend/tests/unmock/discussions.unmocked.test.ts#L170](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L170) | [backend/tests/mock/discussions.mocked.test.ts#L380](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L380) | `discussionModel.findById`, `discussionModel.postMessage`, `Socket.IO` |
| **GET /api/discussions/my/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L220](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L220) | [backend/tests/mock/discussions.mocked.test.ts#L470](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L470) | `discussionModel.findByUserId`, `auth.middleware` |


---

### 2.1.2 Commit Hash

The tests were executed on the following commit on the `main` branch:


## 3. Back-end test specification : Tests of non-functional requirements



## 4. Front-end test specification

## 5. Automated code review results