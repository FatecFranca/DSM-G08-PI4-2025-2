import fs from 'fs';
import axios from 'axios';

const API_URL = 'http://localhost:8081/v1/readings';
const BIKE_UUID = 'c2fc60f7-2801-4632-bb26-70f4d7550d2f';
const DEVICE_UUID = 'd49e1e4b-6e9b-49a1-817c-dcd374d8b139'; // substitua pelo UUID real

const lines = fs.readFileSync('readings.txt', 'utf-8').split('\n').filter(Boolean);

(async () => {
  for (const rawLine of lines) {
    const line = rawLine.trim();

    try {
      const data = JSON.parse(line);

      const payload = {
        bike_uuid: BIKE_UUID,
        pulse_count: 1,
        speed_kmh: data.speed_kmh,
        delta_us: null,
        battery_pct: 100,
        lat: null,
        lon: null,
        ts: new Date().toLocaleString('sv-SE', { timeZone: 'UTC' }).replace(' ', 'T'),
        run_id: 1
      };

      const res = await axios.post(API_URL, payload, {
        headers: {
          'x-device-uuid': DEVICE_UUID
        }
      });

      console.log('Enviado:', payload, '->', res.data);
    } catch (err) {
      if (err.response) {
        console.error('Erro API:', err.response.status, err.response.data);
      } else {
        console.error('Erro ao enviar linha:', line, err.message);
      }
    }
  }
})();
