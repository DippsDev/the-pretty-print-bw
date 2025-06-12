import { supabase } from '../../../lib/supabase';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const crmSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  email: z.string().email(),
  mobile_number: z.string().min(6),
  message: z.string().optional(),
  title: z.string().optional(),
  booking_date: z.coerce.date().optional(), // Accepts string, coerces to Date
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = crmSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    const { first_name, last_name, email, mobile_number, message, booking_date, title } = result.data;

    const { error } = await supabase
      .from('crm')
      .insert([{ first_name, last_name, email, mobile_number, message, booking_date, title }]);
    if (error) {
      return NextResponse.json(
        { error: 'Insert failed', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ message: 'CRM data inserted successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
