// src/components/ui/data-table.tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function DataTable<TData, TValue>({
  columns,
  data,
  showPagination = true,
  maxHeight,
  containerRef,
  onScroll,
  footerContent,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  showPagination?: boolean
  maxHeight?: string
  containerRef?: React.Ref<HTMLDivElement>
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  footerContent?: React.ReactNode
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(showPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  })

  return (
    <div>
      {maxHeight ? (
        <ScrollArea
          className="rounded-md border relative w-full"
          style={{ maxHeight, height: maxHeight }}
          viewportRef={containerRef}
          onScroll={onScroll}
        >
          <Table containerClassName="overflow-visible w-full" className="border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-30 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="text-right bg-card sticky top-0 z-30 font-bold py-3 px-3 border-b-2 border-red-500 shadow-[inset_0_-2px_0_0_#ef4444]"
                      key={header.id}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody dir="rtl">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    موردی یافت نشد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {footerContent}
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      ) : (
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="rounded-md border relative overflow-x-auto"
        >
          <Table>
            <TableHeader className="border-b-2 border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead className="text-right font-bold border-b-2 border-border py-3 px-3" key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody dir="rtl">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    موردی یافت نشد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {footerContent}
        </div>
      )}

      {showPagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            قبلی
          </Button>
          <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            بعدی
          </Button>
        </div>
      )}
    </div>
  )
}
