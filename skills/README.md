# Skills Registry

이 폴더는 SweetGift 프로젝트에서 바로 참조할 수 있는 skill registry다.  
모든 skill은 `skills/<skill-name>/SKILL.md` 또는 단일 문서형 skill 파일로 유지한다.

## Active skills

| name | role | purpose | main outputs |
|---|---|---|---|
| [mvp-contract-sharpening](./mvp-contract-sharpening/SKILL.md) | Product / PM | `docs/mvp-contract.md`, README 요구사항, 범위/비범위를 정리 | `docs/mvp-contract.md`, `README.md` |
| [ux-spec-authoring](./ux-spec-authoring/SKILL.md) | Product Design | SweetGift 플로우와 화면 스펙을 문서화 | `docs/ux/*` |
| [frontend-implementation](./frontend-implementation/SKILL.md) | Frontend Engineer | SweetGift UI/UX를 코드로 구현하고 polish | `apps/web/**` |
| [sweetbook-api-integration](./sweetbook-api-integration/SKILL.md) | Backend Engineer | SweetBook Books/Orders 연동과 env/sandbox 검증 | `apps/api/**`, `docs/sandbox-smoke-test.md` |
| [webapp-testing](./webapp-testing/SKILL.md) | QA / Frontend / Reviewer | Create → Preview → Order → Completion 플로우 검증 | `tests/e2e/*`, QA notes |
| [backend-code-review-skill](./backend-code-review-skill.md) | Reviewer | 백엔드 정합성, 장애 대응, 멱등성 중심 리뷰 | review notes |

## Project rules

- 소스 오브 트루스는 [docs/mvp-contract.md](../docs/mvp-contract.md)다.
- SweetBook 호출은 반드시 백엔드에서만 수행한다.
- 과제 제출 품질은 기능 구현과 함께 `README.md`, `.env.example`, 더미 데이터, 로컬 실행 재현성으로 평가한다.
- imported skill은 원문을 그대로 두지 않고 현재 저장소 구조에 맞게 적응시킨다.
