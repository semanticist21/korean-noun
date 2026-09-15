import { noun } from 'korean-noun'

document.getElementById('out').textContent = JSON.stringify({
  words: [noun(), noun({ even: false })],
  top10: noun({ top: 0.1 }),
})
