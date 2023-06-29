import { useState } from 'react';
import {
  createStyles,
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput,
  Avatar,
  Modal
} from '@mantine/core';
import { keys } from '@mantine/utils';

const useStyles = createStyles((theme) => ({
  th: {
    padding: '10 !important',
  },
  tr:{
    fontFamily: 'Visuelt',
  },
  control: {
    width: '100%',
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
  },
  icon: {
    width: 21,
    height: 21,
    borderRadius: 21,
  },
}));

interface RowData {
  id: string;
  key: string;
  first_name: string;
  middle_name: string
  last_name: string;
  department: string;
  is_active: string;
  value: string;
}

interface TableSortProps {
  data: RowData[];
  selectEmployee: (employeeId: string | undefined) => void;

}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const { classes } = useStyles();
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart">
          <Text style={{fontFamily: 'Visuelt'}} weight={500} size="sm">
            {children}
          </Text>
        </Group>
      </UnstyledButton>
    </th>
  );
}


function filterData(data: RowData[], search: any) {
  const query = search.toString().toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toString().toLowerCase().includes(query))
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return b[sortBy].localeCompare(a[sortBy]);
      }

      return a[sortBy].localeCompare(b[sortBy]);
    }),
    payload.search
  );
}

function EmployeeTable({ data, selectEmployee }: TableSortProps) {
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const { id } = event.currentTarget.dataset;
    selectEmployee(id)
  };

  const rows = sortedData.map((row) => (
    <tr data-id={row.key} onClick={(e) => {
        handleRowClick(e)
      }} key={row.key}>
      <td data-id={row.key}>
      <Text style={{fontSize:'15px', color:'black'}}>{row.first_name}</Text></td>
      <td data-id={row.key}>{
        <Text style={{fontSize:'15px', color:'black'}}>{row.last_name}</Text>
      }</td>
      <td data-id={row.id}>{
        <Text style={{fontSize:'15px', color:'black'}}>{row.department}</Text>
      }</td>
      <td data-id={row.id}>{
        <Text style={{fontSize:'15px', color:'black'}}>{row.is_active ? "Active" : "Inactive"}</Text>
      }</td>
    </tr>
  ));

  return (
    <ScrollArea>
      <div style={{height: 30}}/>
      <Table
        verticalSpacing="xs"
        highlightOnHover={true}
        sx={{maxWidth:'75vw', backgroundColor: 'white'}}
      >
        <thead>
          <tr>
            <Th
              sorted={sortBy === 'first_name'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('first_name')}

            >
              <Text style={{fontSize:'15px', color:'black'}}>First Name</Text>
            </Th>
            <Th
              sorted={sortBy === 'last_name'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('last_name')}
            >
               <Text style={{fontSize:'15px', color:'black'}}>Last Name</Text>
            </Th>
            <Th
              sorted={sortBy === 'department'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('department')}
            >
               <Text style={{fontSize:'15px', color:'black'}}>Department</Text>
            </Th>
            <Th
              sorted={sortBy === 'is_active'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('is_active')}
            >
               <Text style={{fontSize:'15px', color:'black'}}>Status</Text>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <tr>
              <td colSpan={3}>
                <Text weight={500} align="center">
                  Nothing found
                </Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </ScrollArea>
  );
}

export default EmployeeTable