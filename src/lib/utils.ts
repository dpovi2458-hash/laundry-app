import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatFecha(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  if (!isValid(date)) return 'Fecha inválida';
  return format(date, 'dd/MM/yyyy', { locale: es });
}

export function formatFechaHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  if (!isValid(date)) return 'Fecha inválida';
  return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
}

export function formatMoneda(monto: number, moneda: string = 'S/'): string {
  return `${moneda} ${monto.toFixed(2)}`;
}

export function getHoy(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getInicioSemana(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getFinSemana(): string {
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getInicioMes(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

export function getFinMes(): string {
  return format(endOfMonth(new Date()), 'yyyy-MM-dd');
}

export function getNombreMes(fecha: Date = new Date()): string {
  return format(fecha, 'MMMM yyyy', { locale: es });
}

export function getDiaSemana(fecha: Date = new Date()): string {
  return format(fecha, 'EEEE', { locale: es });
}

export function getRangoMes(year: number, month: number): { inicio: string; fin: string } {
  const fecha = new Date(year, month, 1);
  return {
    inicio: format(startOfMonth(fecha), 'yyyy-MM-dd'),
    fin: format(endOfMonth(fecha), 'yyyy-MM-dd'),
  };
}

// Generar meses para selector
export function getMesesDisponibles(): { value: string; label: string; year: number; month: number }[] {
  const meses = [];
  const hoy = new Date();
  
  // Desde enero 2025 hasta diciembre 2026
  for (let year = 2025; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const fecha = new Date(year, month, 1);
      if (fecha <= new Date(2026, 11, 31)) {
        meses.push({
          value: `${year}-${String(month + 1).padStart(2, '0')}`,
          label: format(fecha, 'MMMM yyyy', { locale: es }),
          year,
          month,
        });
      }
    }
  }
  
  return meses;
}

// Obtener días del mes actual
export function getDiasDelMes(year: number, month: number): string[] {
  const inicio = startOfMonth(new Date(year, month, 1));
  const fin = endOfMonth(new Date(year, month, 1));
  const dias: string[] = [];
  
  let current = inicio;
  while (current <= fin) {
    dias.push(format(current, 'yyyy-MM-dd'));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return dias;
}
