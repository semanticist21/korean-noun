import { noun } from 'korean-noun/top10'

let error = null
try {
  noun({ top: 0.5 })
} catch (e) {
  error = e.name
}
document.getElementById('out').textContent = JSON.stringify({
  words: [noun(), noun({ even: false })],
  error,
})
