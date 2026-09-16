import { noun } from 'korean-noun/top10'

let error = null
try {
  noun({ top: 1.5 })
} catch (e) {
  error = e.name
}
document.getElementById('out').textContent = JSON.stringify({
  words: [noun(), noun({ even: false })],
  half: noun({ top: 0.5 }),
  three: noun({ length: 3, even: false }),
  error,
})
