import { PageHeader } from "@/components/shared/page-header";
import { ProductosCliente } from "@/components/productos/productos-cliente";
import {
  getCategorias,
  getProductos,
  getAllCategoriaMedidas,
  getSucursales,
  getAllPizzaSabores,
  getAllProductoExtras,
} from "@/lib/services/productos";

interface SearchParams {
  page?: string;
  search?: string;
  categoria?: string;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const search = sp.search ?? "";
  const categoriaId = sp.categoria ?? "";

  const [
    { data: productos, total, totalPages, perPage },
    categorias,
    categoriaMedidas,
    sucursales,
    saboresPorCategoria,
    extrasPorCategoria,
  ] = await Promise.all([
    getProductos({
      page,
      perPage: 10,
      search: search || undefined,
      categoriaId: categoriaId || undefined,
    }),
    getCategorias(),
    getAllCategoriaMedidas(),
    getSucursales(),
    getAllPizzaSabores(),
    getAllProductoExtras(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos, categorías y medidas"
      />
      <ProductosCliente
        productos={productos}
        categorias={categorias}
        categoriaMedidas={categoriaMedidas}
        sucursales={sucursales}
        saboresPorCategoria={saboresPorCategoria}
        extrasPorCategoria={extrasPorCategoria}
        total={total}
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        searchParam={search}
        categoriaParam={categoriaId}
      />
    </div>
  );
}
