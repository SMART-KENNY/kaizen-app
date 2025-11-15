const tooltipBtn = document.getElementById('tooltipBtn');
const tooltip = document.getElementById('tooltip');

tooltipBtn.addEventListener('click', () => {
  tooltip.classList.toggle('show');
});

// Close tooltip when clicking outside
document.addEventListener('click', (e) => {
  if (!tooltip.contains(e.target) && !tooltipBtn.contains(e.target)) {
    tooltip.classList.remove('show');
  }
});
