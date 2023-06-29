
//There is a new feature from React's SSR to recognize whether a component is client-side or server-side
'use client';
import {useState, useEffect, forwardRef} from 'react'
import {Text, Select, Group, Avatar, Divider, Modal, Notification, Loader, Center, Card} from '@mantine/core'
import axios from 'axios'
import { useRouter } from 'next/router'

import EmployeeTable from './components/EmployeeTable'

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  image: string;
  label: string;
  value: string;
  token: string;
}

interface ProviderCompany {
  id: string;
  legal_name: string | null;
  ein: string | null;
  entity: {
    type: string;
    subtype: string;
  } | null;
  primary_email: string | null;
  primary_phone_number: string | null;
  accounts: any[] | null;
  departments: any[] | null;
  locations: any[] | null;
}

interface IndividualDetail {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  emails: any[] | null;
  phone_numbers: any[] | null;
  residence: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    } | null;
  gender: string | null;
  dob: string | null;

}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ image, value, label, ...others }: ItemProps, ref) => (
    <div key={value} ref={ref} {...others}>
      <Group key={value} noWrap>
        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )
);

// Manually designating the display name instead of creating a functional component.
SelectItem.displayName = "SelectItem"

function Home() {

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sandboxProviders, setSandboxProviders] = useState<any[]>([
    {
      value:'gusto',
      label: 'Gusto'
    },
    {
      value:'bamboohr',
      label: 'BambooHR'
    },
    {
      value:'justworks',
      label: 'Justworks'
    },
    {
      value:'paychex_flex',
      label: 'Paychex Flex'
    },
    {
      value: 'workday',
      label: 'Workday'
    }
  ])
  const [providerCompany, setProviderCompany] = useState<ProviderCompany | null >(null)
  const [providerDirectory, setProviderDirectory] = useState<any | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<IndividualDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)


  const fetchProviderToken = async (providerId: string) => {
    // Check if provider token has already been fetched
    if(!sandboxProviders.filter((provider) => provider.value === providerId)[0].token) {
      // Provider token does not exist.  So, fetch it.
      try {
        const res = await axios({
          method: 'POST',
          url: '/api/sandbox/create',
          data: {
            provider: providerId,
            products: [
              "company", "directory", "individual", "employment"
            ]
          }
        });
        
        if(res.data && res.data.access_token) {
            var updatedSandboxProviders = sandboxProviders.map((provider) => {
                if(provider.value === providerId) {
                  provider.token = res.data.access_token
                }
                return provider;
              }
            );
            setSandboxProviders(updatedSandboxProviders);
            return res.data.access_token; 
          }
        } catch (err) {
          console.log(err);
        }
    } else {
      // Provider token already exists.  So, simply return the existing token.
      return sandboxProviders.filter((provider) => provider.value === providerId)[0].token
    }
  }

  const fetchProviderCompany = async (providerToken: string) => {
    
    setLoading(true)

    await axios({
      method: 'GET',
      url: '/api/employer/company',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    }).then((res) => {
      if(res.data && res.data.id) {
       const company = res.data
       let providerCompany : ProviderCompany = {
          id: company.id,
          legal_name: company.legal_name ? company.legal_name : null,
          ein: company.ein ? company.ein : null,
          entity: company.entity ? {
            type: company.entity.type ? company.entity.type : null,
            subtype: company.entity.subtype ? company.entity.subtype : null
          } : null, 
          primary_email: company.primary_email ? company.primary_email : null,
          primary_phone_number: company.primary_phone_number ? company.primary_phone_number : null,
          accounts: company.accounts ? company.accounts : null,
          departments: company.departments ? company.departments : null,
          locations: company.locations ? company.locations : null
        }
        setProviderCompany(providerCompany)
        setLoading(false)
        return providerCompany
      }
    }).catch((err) => {
      console.log(err)
      setLoading(false)
      if(err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message == "Not Implemented") {
          setError("This provider does not support the Company API")
          setProviderCompany(null)
        }
      } else {
        setError("Error fetching provider company")
      }
      return null
    })
  }

  const fetchProviderDirectory = async (providerToken: string) => {
    await axios({
      method: 'GET',
      url: '/api/employer/directory',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    }).then((res) => {
      if(res.data){
        let employeeArray = res.data.individuals ? res.data.individuals : []
        let tableData = employeeArray.map((employee: any) => {
          return {
            id: employee.id,
            key: employee.id,
            value: employee.id,
            first_name: employee.first_name ? employee.first_name : null,
            last_name: employee.last_name ? employee.last_name : null,
            middle_name: employee.middle_name ? employee.middle_name : null,
            department: employee.department.name ? employee.department.name : null,
            is_active: employee.is_active ? employee.is_active : null,
          }
        })
        setProviderDirectory(tableData)
      }
      setError(null)
    }).catch((err) => {
      console.log(err)
      setError("Error fetching provider directory")
    })
  }

  const fetchEmployeeDetails = async (providerToken: string, employeeId: string) => {

    console.log("Provider Token")
    console.log(providerToken)

    console.log("Employee Id")
    console.log(employeeId)

      await axios({
        method: 'POST',
        url: '/api/employer/individual',
        headers: {
          'Authorization': `Bearer ${providerToken}`
        },
        data: {
          requests: [
            {
              individual_id: employeeId
            }
          ]
        }
      }).then((res) => {  
        let responses = res.data.responses
        console.log(res)
        if(res.data.responses && responses.length > 0) {
          let employeeData = responses[0].body
          let employee: IndividualDetail = {
            id: responses[0].individual_id,
            first_name: employeeData.first_name ? employeeData.first_name : null,
            last_name: employeeData.last_name ? employeeData.last_name : null,
            middle_name: employeeData.middle_name ? employeeData.middle_name : null,
            preferred_name: employeeData.preferred_name ? employeeData.preferred_name : null,
            emails: employeeData.emails ? employeeData.emails : null,
            phone_numbers: employeeData.phone_numbers ? employeeData.phone_numbers : null,
            residence: employeeData.residence ? {
              line1: employeeData.residence.line1 ? employeeData.residence.line1 : null,
              line2: employeeData.residence.line2 ? employeeData.residence.line2 : null,
              city: employeeData.residence.city ? employeeData.residence.city : null,
              state: employeeData.residence.state ? employeeData.residence.state : null,
              postal_code: employeeData.residence.postal_code ? employeeData.residence.postal_code : null,
              country: employeeData.residence.country ? employeeData.residence.country : null,
            } : null,
            dob: employeeData.dob ? employeeData.dob : null,
            gender: employeeData.gender ? employeeData.gender : null
          }
            console.log("Employee")
            console.log(employee)

            setSelectedEmployee(employee)
            return employee
          }

      }).catch((err) => {
        console.log(err)
        setError("Error fetching employee details")
      })


  }

  const updateSelectedProvider = async (providerId: string) => { 
    setSelectedProvider(providerId)
    const token = await fetchProviderToken(providerId)
    if(token !== null) {
      const providerCompany = await fetchProviderCompany(token)
      const providerDirectory = await fetchProviderDirectory(token)
    } else {
       setError("Error fetching provider token")
    }
  }

  const selectEmployee = async (employeeId: string | undefined) => {
    if(selectedProvider && employeeId) {
      let providerToken = await fetchProviderToken(selectedProvider)
      const individual = await fetchEmployeeDetails(providerToken, employeeId)

      if(individual !== null) {
        setShowModal(true)
        console.log("Individual")
        console.log(individual)
      }

    } else {
      setError("Error fetching employee details")
    }

  }

  return (
    <div style={{padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100vw'}}>
      {
        showModal ? (
          <Modal opened={showModal} onClose={() => {
            setShowModal(false)
          }}>
            <div>
              <Text>
                Individual Employee
              </Text>
              <div style={{paddingTop: 20}}>
                <Text>
                  {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                </Text>
                
                </div>
            </div>
          </Modal>
        ) : null
      }
      {
        error ? (
          <Notification color="red">
            {error}
          </Notification>
        ) : null
      }
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '50%'}}>
        <Select
          value={selectedProvider}
          label={
            <Text style={{color: 'white'}}>
              Select provider
            </Text>
          }
          data={sandboxProviders}
          placeholder='Select provider'
          itemComponent={SelectItem}
          onChange={updateSelectedProvider}
          />
      </div>
      <div style={{paddingTop: 20, width: '50%'}}>
        {
          selectedProvider && providerCompany && !loading ? (
              <div>
                <Text sx={{fontSize: '20px', fontWeight: 'bold'}}>
                  Company Details
                </Text>
                <Card>
                  <Card.Section style={{padding: 20}}>
                    <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                      General
                    </Text>
                    <Divider/>
                    <Text>
                      Legal Name: {providerCompany?.legal_name ? providerCompany?.legal_name : "Not available for this provider."}
                    </Text>
                    <Text>
                      EIN: {providerCompany?.ein ? providerCompany?.ein : "Not available for this provider."}
                    </Text>
                    <Text>
                      Primary Email: {providerCompany?.primary_email ? providerCompany?.primary_email : "Not available for this provider."}
                    </Text>
                    <Text>
                      Phone Number: {providerCompany?.primary_phone_number ? providerCompany?.primary_phone_number : "Not available for this provider."}
                    </Text>
                  </Card.Section>
                  {
                    providerCompany?.entity ? (
                      <Card.Section style={{padding: 20, paddingTop: 10}}>
                          <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                            Entity Type
                          </Text>
                          <Divider/>
                          <Text>
                            Type: {providerCompany?.entity?.type ? providerCompany?.entity?.type : "Not available for this provider."}
                          </Text>
                          <Text>
                            Subtype: {providerCompany?.entity?.subtype ? providerCompany?.entity?.subtype : "Not available for this provider."}
                          </Text>
                      </Card.Section>
                    ) : null
                  }
                </Card>
              </div>
          ) : loading ? (
              <Center>
                <Loader/>
              </Center>
          ) : null
        }
      </div>
      <div style={{paddingTop: 20, width: '100%'}}>
          {
            selectedProvider && providerDirectory ? (
                <div>
                  <Text sx={{fontSize: '20px', fontWeight: 'bold'}}>
                    Employee Directory
                  </Text>
                  <EmployeeTable data={providerDirectory} selectEmployee={selectEmployee}/>
                </div>
            ) : loading ? (
                <Center>
                  <Loader/>
                </Center>
            ) : null
          }

      </div>         
    </div>
  )
}

export default Home