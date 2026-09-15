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
| `top` | 진입점 최대값 | `(0, 1]`. 빈도 상위 몇 %까지 뽑을지. 어느 진입점에서든 전체 목록 기준입니다. |
| `even` | `true` | `true`면 범위 안에서 균등, `false`면 사용 빈도에 비례. |

범위를 벗어난 `top`은 `RangeError`를 던집니다.

## 번들 크기 줄이기

필요한 범위까지만 데이터를 담은 진입점을 import하면 나머지 데이터는 번들에 들어가지 않습니다.

| import | 담긴 범위 | `top` 허용 |
|---|---|---|
| `korean-noun` | 전체 | `(0, 1]` |
| `korean-noun/top50` | 상위 50% | `(0, 0.5]` |
| `korean-noun/top25` | 상위 25% | `(0, 0.25]` |
| `korean-noun/top10` | 상위 10% | `(0, 0.1]` |

```js
import { noun } from 'korean-noun/top10'

noun()             // 상위 10% 안에서
noun({ top: 0.5 }) // RangeError
```

ESM 전용이며 Node, 브라우저, 번들러에서 동기로 동작합니다. 데이터는 첫 호출 때 한 번 파싱합니다.

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
