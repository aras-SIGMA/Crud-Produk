import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/products -> list all products (dengan join category)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    const pool = getPool();
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.id_categories, 
        c.name_categories, 
        p.created_at 
      FROM products p
      LEFT JOIN categories c ON p.id_categories = c.id_categories
    `;
    const params = [];

    if (categoryId) {
      query += ' WHERE p.id_categories = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY p.id DESC';

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/products -> create a new product
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, price, id_categories } = body;

    if (!name || price === undefined || price === '') {
      return NextResponse.json(
        { error: 'Field "name" dan "price" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const categoryVal = id_categories ? Number(id_categories) : null;

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, id_categories) VALUES (?, ?, ?, ?)',
      [name, description || null, price, categoryVal]
    );

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        description: description || null,
        price,
        id_categories: categoryVal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
