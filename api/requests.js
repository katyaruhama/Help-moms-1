const requests = [
  {
    id: 'food-after-discharge',
    kind: 'food',
    title: 'Еда на два дня после выписки',
    meta: 'Мама с новорождённым · 2 недели после родов',
    description: 'Нужны простые блюда без острого: суп, каша, запечённые овощи. Можно передать у двери.',
    place: 'Северный район',
    time: 'завтра до 18:00',
    duration: '1-2 часа'
  },
  {
    id: 'light-kitchen-cleaning',
    kind: 'cleaning',
    title: 'Лёгкая уборка кухни и пола',
    meta: 'После кесарева · вечер буднего дня',
    description: 'Протереть поверхности, вынести мусор, помыть пол. Без перестановок и тяжёлых предметов.',
    place: 'центр города',
    time: 'после 18:00',
    duration: 'до 1,5 часа'
  },
  {
    id: 'pharmacy-pickup',
    kind: 'shopping',
    title: 'Забрать заказ из аптеки',
    meta: 'Мама дома одна · ближайшее время после 18:00',
    description: 'Нужно забрать оплаченный заказ и оставить у консьержа. Контакт передаст координатор.',
    place: 'аптека рядом с домом',
    time: 'сегодня',
    duration: 'около 30 минут'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  return sendJson(res, 200, { requests });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
