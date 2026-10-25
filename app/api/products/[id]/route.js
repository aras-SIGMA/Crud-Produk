import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/products/:id -> get one product
export async function GET(request, { params }) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.id_categories, 
        c.name_categories, 
        p.created_at 
      FROM products p
      LEFT JOIN categories c ON p.id_categories = c.id_categories
      WHERE p.id = ?`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/products/:id -> update a product
export async function PUT(request, { params }) {
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
      'UPDATE products SET name = ?, description = ?, price = ?, id_categories = ? WHERE id = ?',
      [name, description || null, price, categoryVal, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: Number(params.id),
      name,
      description: description || null,
      price,
      id_categories: categoryVal,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/products/:id -> delete a product
export async function DELETE(request, { params }) {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [
      params.id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
