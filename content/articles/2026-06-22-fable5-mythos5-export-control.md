# 세계 최강 AI 모델 72시간 만에 사라졌다 — Fable 5·Mythos 5 수출 통제 완전 해부

**날짜**: 2026-06-22  
**주제**: AI 안전·거버넌스  
**키워드**: Anthropic, Fable 5, Mythos 5, 수출 통제, 젤브레이크, AI 거버넌스

---

## 개요

2026년 6월 9일 오전, Anthropic은 역대 가장 강력한 AI 모델 두 종류를 세상에 공개했다. 상업용 Fable 5와 사이버보안 특화 Mythos 5. 그러나 불과 72시간 뒤인 12일, 미국 상무부 산업안보국(BIS)의 수출 통제 명령으로 두 모델은 전 세계 모든 사용자에게서 차단됐다. 런칭과 동시에 글로벌 셧다운. AI 역사상 전례 없는 사건이다.

---

## 사건 1: Mythos 5의 정체 — "세계 최강 사이버보안 AI"

Mythos 5는 단순한 차세대 모델이 아니었다. Anthropic은 2026년 4월 프리뷰 단계부터 극소수의 사이버 방어 조직과 인프라 제공업체에만 제한 공개했다. 그 이유는 분명했다.

**Mythos 5의 사이버보안 능력:**
- 17년된 FreeBSD 원격 코드 실행(RCE) 취약점을 완전 자율적으로 발견 및 익스플로잇 (인간 개입 없음)
- 이미 공개된 Windows 커널 취약점에 대한 실제 동작 익스플로잇을 **31분 만에** 작성
- 기존에 수 주가 걸리던 취약점 분석을 수 시간, 또는 수 분으로 단축

Anthropic은 이러한 위험을 인지하고, 상업용 Fable 5에는 고위험 쿼리(사이버, 생물학, 화학 등)를 자동으로 하위 모델로 라우팅하는 안전장치를 장착했다. Mythos 5의 실질적 사이버 능력은 Project Glasswing이라는 프로그램을 통해 미국 정부 협력 하에 사이버 방어 도구로만 활용됐다.

**출처**: [Anthropic 사이버보안 평가 보고서](https://red.anthropic.com/2026/mythos-preview/), [Wiz 블로그](https://www.wiz.io/blog/claude-mythos)

---

## 사건 2: 런칭 72시간 만에 글로벌 셧다운

타임라인은 충격적으로 빠르게 전개됐다.

| 일자 | 사건 |
|------|------|
| 2026-06-09 | Anthropic, Fable 5 & Mythos 5 공식 출시 |
| 2026-06-12 | 상무부 BIS, 외국 국적자 접근 차단 수출 통제 지시 발동 |
| 2026-06-12 | Anthropic, 전 세계 모든 사용자 대상 두 모델 완전 차단 |
| 2026-06-13 | Anthropic 공식 성명 발표, 조치에 이의 제기 |

BIS 지시의 핵심은 "외국 국적자(foreign nationals)의 Fable 5 및 Mythos 5 접근을 금지"였다. 그러나 수억 명의 사용자 중 국적을 실시간으로 확인하는 것이 기술적으로 불가능하다는 이유로, Anthropic은 사실상 모든 사용자에게서 두 모델을 차단하는 결정을 내렸다.

이는 AI 모델에 대한 미국 정부의 수출 통제 최초 사례다. 그동안 반도체 칩에 적용되던 수출 통제가 소프트웨어 모델 자체로 확장된 것이다.

**출처**: [Fortune](https://fortune.com/2026/06/13/anthropic-disables-fable-mythos-export-controls-national-security-threat/), [The Hacker News](https://thehackernews.com/2026/06/us-orders-anthropic-to-suspend-fable-5.html)

---

## 사건 3: 젤브레이크 의혹의 실체와 Anthropic의 반박

정부가 공식적으로 밝힌 차단 이유는 "Fable 5의 안전장치를 우회하는 젤브레이크 기법이 존재한다"는 것이었다. 그러나 실제 내용은 훨씬 복잡하다.

**알려진 젤브레이크 기법:**
- 보안 연구자 "Pliny the Liberator"가 멀티에이전트 분해(multi-agent decomposition), 유니코드 트릭, 내러티브 프레이밍을 조합해 Fable 5의 안전 분류기를 우회 주장
- 기법의 핵심은 모델에게 특정 코드베이스를 읽고 소프트웨어 결함을 찾도록 지시하는 방식

**Anthropic의 반박:**
- 공개된 잠재적 젤브레이크는 완전히 무해한 응답이거나 경미한 발견에 불과
- 해당 기법이 실제로 유해한 결과를 낸 사례가 없음
- 이 기준을 업계 전체에 적용하면 모든 프론티어 모델의 배포가 사실상 불가능해짐

**실제 이유에 대한 보도:**
더 깊은 이유가 있다는 분석도 있다. Amazon이 내부적으로 Fable 5 젤브레이크를 발견해 신고했고, SK Telecom이 Project Glasswing을 통해 Mythos 5에 접근했으며, 미국 관리들이 이에 중국 연계 우려를 품었다는 보도가 있다.

**출처**: [Anthropic 공식 성명](https://www.anthropic.com/news/fable-mythos-access), [Daily Security Review](https://dailysecurityreview.com/cyber-security/anthropic-disputes-jailbreak-claim-against-claude-fable-5/)

---

## 사건 4: 미국의 통제가 오픈 웨이트 모델 채택을 가속화한 아이러니

Fable 5 금지령이 내려진 직후 예상치 못한 일이 벌어졌다. 미국 바깥의 기업들이 즉각 오픈 웨이트 AI 모델로 눈을 돌린 것이다.

금지 이후 일주일 만에:
- **Cohere**의 오픈 웨이트 코딩 모델
- **Moonshot**(중국계)의 오픈 웨이트 모델
- **Zhipu**(중국계)의 오픈 웨이트 모델

이 세 모델이 포춘 500 기업들의 즉각적인 대체 공급원이 됐다. 약 100명의 사이버보안 전문가들은 이 금지 조치가 과잉 대응이라고 비판했다.

가장 아이러니한 결과: 미국이 자국 AI 모델의 글로벌 접근을 막음으로써, 중국 오픈 웨이트 모델의 글로벌 채택을 오히려 가속화했다. 폐쇄형 모델 통제가 오픈소스 생태계를 강화하는 역설이다.

**출처**: [The New Stack](https://thenewstack.io/fable-ban-open-weights/), [TrueFoundry 블로그](https://www.truefoundry.com/blog/fable-mythos-ban)

---

## 사건 5: 글로벌 AI 거버넌스의 분기점 — "AI 킬 스위치"의 등장

EU 정책 싱크탱크 CEP는 이번 사건을 "지정학적 신호"로 분석했다. 기술적 필요성보다 전략적 메시지에 가깝다는 것이다.

**핵심 선례:**
- AI 모델(소프트웨어)에 대한 미국 수출 통제 최초 사례
- 하룻밤 사이 수억 명이 사용하는 모델의 글로벌 접근 차단 가능성 증명
- "Frontier AI는 미국의 전략적 통제 하에 있다"는 메시지

이 사건은 EU의 클라우드·AI 개발법(CADA), 한국의 AI 기본법 논의, 중국의 AI 규제 프레임워크와 맞물리며 전 세계 AI 주권 논쟁을 촉발했다. 특히 AI 모델 접근 의존성이 국가 안보 취약점이 될 수 있다는 경각심을 높였다.

Anthropic은 조치가 일시적이라고 밝혔으며, 수 일 내 복구가 가능할 수 있다고 했다. 그러나 이 사건이 남긴 선례는 영구적이다.

**출처**: [CEP 분석](https://www.cep.eu/eu-topics/details/us-access-ban-on-anthropics-fablemythos-5-more-of-a-geopolitical-signal-than-a-necessary-security-measure.html), [AI Weekly](https://aiweekly.co/newsletters/ai-regulation/export-control-law-just-became-an-ai-kill-switch)

---

## 시사점: AI 모델은 이제 지정학적 무기다

이 사건은 AI 기술이 단순한 소프트웨어 제품을 넘어섰음을 보여준다.

1. **사이버 능력의 임계점**: 익스플로잇을 수 분 만에 생성하는 AI는 기존 사이버 공격의 패러다임을 바꾼다. 정부가 이를 통제하려는 것은 이해 가능하다.

2. **AI 안전의 상업적 딜레마**: 상업용 모델에 강력한 사이버 능력을 탑재하면서 안전장치로만 제어하려는 접근의 한계를 보여줬다. "기술이 존재한다면 누군가는 우회한다."

3. **오픈소스의 반격**: 폐쇄형 모델 통제는 오픈 웨이트 생태계를 강화한다. 진정한 AI 안보를 위해서는 다른 접근이 필요하다.

4. **다중 공급자 전략**: 기업들은 단일 AI 공급자에 의존하는 것의 리스크를 학습했다. AI 게이트웨이와 멀티 프로바이더 전략이 필수가 됐다.

72시간. 이것이 세계 최강 AI 모델의 수명이었다. 그리고 AI 거버넌스의 새로운 시대가 열렸다.
