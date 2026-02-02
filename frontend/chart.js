export function createChart(ctx, labels, datasets) {
    return new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: { /* 차트 옵션 설정 */ }
    });
}