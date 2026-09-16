# korean-noun

표준국어대사전 명사 중 하나를 랜덤으로 뽑습니다. 한국어 위키백과 사용 빈도로 순위를 매겨, 자주 쓰는 단어 범위만 고르거나 빈도에 비례해 뽑을 수 있습니다.

```sh
npm install korean-noun
```

```js
import { noun } from 'korean-noun'

noun()                          // 전체 명사 중 균등 랜덤
noun({ top: 0.1 })              // 빈도 상위 10% 안에서
noun({ top: 0.5, even: false }) // 상위 50% 안에서, 자주 쓰는 단어일수록 잘 나옴
```

## 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `top` | `1` | `(0, 1]`. import한 단어 세트 안에서 빈도 상위 몇 %까지 뽑을지. |
| `even` | `true` | `true`면 범위 안에서 균등, `false`면 사용 빈도에 비례. |
| `length` | - | 정확한 글자(음절) 수. `minLength`/`maxLength`와 같이 쓸 수 없습니다. |
| `minLength` | - | 최소 글자 수 (포함). |
| `maxLength` | - | 최대 글자 수 (포함). |
| `startsWith` | - | 이 음절(들)로 시작. 한글 음절만 받습니다. |
| `endsWith` | - | 이 음절(들)로 끝남. |
| `batchim` | - | `true`면 마지막 글자에 받침 있음, `false`면 없음. |
| `random` | `Math.random` | `[0, 1)` 난수를 돌려주는 함수. 결과를 재현할 때 씁니다. |

`top`으로 빈도 범위를 먼저 자르고, 나머지 조건은 그 안에서 모두 AND로 적용합니다.

```js
noun({ length: 3 })                             // 3글자
noun({ top: 0.2, minLength: 2, maxLength: 4 })  // 상위 20% 중 2~4글자
noun({ startsWith: '가', batchim: false })      // '가'로 시작하고 받침 없음
noun({ endsWith: '기', even: false })           // '기'로 끝남, 빈도 비례
```

- `startsWith`는 글자 그대로 비교합니다. 끝말잇기의 두음법칙(력→역)은 직접 처리해야 합니다. 어떤 단어도 시작하지 않는 음절(예: `'력'`, `'름'`)이면 `RangeError`가 납니다.
- `batchim`은 ㄹ 받침도 받침으로 셉니다. '(으)로'처럼 ㄹ을 받침 없음으로 다루는 조사는 따로 처리하세요.

### 여러 개 뽑기

```js
import { nouns } from 'korean-noun'

nouns(5)                                  // 서로 다른 5개
nouns(3, { top: 0.1, length: 2, even: false })
```

같은 옵션을 받고, 중복 없이 뽑은 순서대로 돌려줍니다. `even: false`면 빈도 비례로 하나씩 뽑고 뺀 결과입니다. 조건에 맞는 단어가 `count`보다 적으면 `RangeError`를 던집니다. `count`가 0이면 옵션만 검사하고, 맞는 단어가 없어도 `[]`를 돌려줍니다.

### 결과 재현하기

```js
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(42)
noun({ random })
nouns(3, { random })
```

같은 `random` 순서면 같은 패키지 버전 안에서 같은 결과가 나옵니다. 데이터가 바뀌는 버전 사이에서는 달라질 수 있습니다. `nouns(n)`과 `noun()`을 n번 부른 결과는 같지 않습니다.

### 에러

- `RangeError`: 값 범위가 잘못됐거나(`top`, 글자 수, 한글이 아닌 `startsWith`, `random()` 반환값), 조건에 맞는 단어가 없거나, `nouns`의 `count`가 맞는 단어 수보다 많을 때.
- `TypeError`: 옵션이 일반 객체가 아닐 때, 모르는 옵션 이름(오타 포함), 타입이 틀린 값(`top: '0.5'` 등), `length`를 `minLength`/`maxLength`와 같이 줄 때.

## 단어 세트 고르기

import 경로마다 담긴 단어 세트가 다르고, `top`은 그 세트 안에서의 비율입니다. 작은 세트를 import하면 나머지 데이터는 번들에 들어가지 않습니다.

| import | 단어 세트 | 번들 크기 (Vite) |
|---|---|---|
| `korean-noun` | 전체 10만 개 | 약 1.3MB |
| `korean-noun/top50` | 빈도 상위 50% | 약 0.65MB |
| `korean-noun/top25` | 빈도 상위 25% | 약 0.33MB |
| `korean-noun/top10` | 빈도 상위 10% | 약 0.13MB |

```js
import { noun } from 'korean-noun/top10'

noun()                           // 상위 10% 세트에서
noun({ top: 0.5 })               // 상위 10% 세트의 상위 절반 (전체 기준 상위 5%)
noun({ top: 0.5, even: false })  // 위 범위에서 빈도 비례
```

ESM 패키지이며 Node, 브라우저, 번들러에서 동기로 동작합니다. CommonJS는 `require(esm)`을 지원하는 Node 20.19+ / 22.12+에서 `require('korean-noun')`로 쓸 수 있습니다. 데이터는 첫 호출 때 한 번 파싱합니다.

## 데이터

- 표준국어대사전 전체 내려받기(XML)에서 품사가 명사인 표제어를 뽑았습니다.
- 표기 기호(`-`, `^`)와 동음이의어 번호를 없애고 같은 단어는 합쳤습니다.
- 인명·지명·책명 같은 고유 명사, 뜻풀이가 낮잡아·속되게 이르는 말인 단어, 한글 음절 외 문자가 섞인 단어는 뺐습니다.
- 한국어 위키백과 덤프를 [Kiwi](https://github.com/bab2min/Kiwi) 형태소 분석기로 분석해 명사 출현 횟수를 셌습니다. 3음절 이상 사전 표제어는 사용자 단어로 등록해 합성어가 쪼개지지 않게 했습니다. 1~2음절까지 등록하면 조사·어미가 명사로 잘못 잡혀서 뺐습니다.
- 한 번도 나오지 않은 단어는 빼고 빈도 상위 최대 10만 개를 담았습니다.

위키백과 기반이라 백과사전식 단어(학술어, 한자어)가 일상어보다 순위가 높게 나올 수 있습니다.

데이터 다시 만들기 (Bun, uv 필요):

```sh
# raw/stdict/ 에 표준국어대사전 XML 전체 내려받기 ZIP
# raw/ 에 kowiki-latest-pages-articles.xml.bz2
bun run extract
bun run count
bun run build:data
```

## 라이선스

- 코드: MIT
- `data/`: CC BY-SA 4.0. 국립국어원 표준국어대사전(CC BY-SA 2.0 KR)과 한국어 위키백과(CC BY-SA 4.0)를 가공했습니다. 자세한 출처는 [data/LICENSE](data/LICENSE)를 보세요.
