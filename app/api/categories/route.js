import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/categories -> ambil semua kategori
export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id_categories, name_categories FROM categories ORDER BY name_categories ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/categories -> tambah kategori baru
export async function POST(request) {
  try {
    const body = await request.json();
    const name_categories = (body.name_categories || body.name || '').trim();

    if (!name_categories) {
      return NextResponse.json(
        { error: 'Field "name_categories" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO categories (name_categories) VALUES (?)',
      [name_categories]
    );

    return NextResponse.json(
      { id_categories: result.insertId, name_categories },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
